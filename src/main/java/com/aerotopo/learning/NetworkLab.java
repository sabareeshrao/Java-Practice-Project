package com.aerotopo.learning;

import java.io.*;
import java.net.*;
import java.net.http.*;
import java.nio.*;
import java.nio.channels.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.*;

public final class NetworkLab {
    public String tcpEcho(String message) throws Exception {
        try(ServerSocket server=new ServerSocket(0,1,InetAddress.getLoopbackAddress());
            var executor=Executors.newSingleThreadExecutor()) {
            server.setSoTimeout(2000);
            Future<?> serving=executor.submit(() -> {
                try(Socket socket=server.accept()) {
                    socket.setSoTimeout(2000);
                    var reader=new BufferedReader(new InputStreamReader(socket.getInputStream(),StandardCharsets.UTF_8));
                    var writer=new PrintWriter(new OutputStreamWriter(socket.getOutputStream(),StandardCharsets.UTF_8),true);
                    writer.println(reader.readLine());
                } catch(IOException failure) { throw new UncheckedIOException(failure); }
            });
            try(Socket client=new Socket()) {
                client.connect(new InetSocketAddress(InetAddress.getLoopbackAddress(),server.getLocalPort()),2000);
                client.setSoTimeout(2000);
                var writer=new PrintWriter(new OutputStreamWriter(client.getOutputStream(),StandardCharsets.UTF_8),true);
                var reader=new BufferedReader(new InputStreamReader(client.getInputStream(),StandardCharsets.UTF_8));
                writer.println(message);
                String result=reader.readLine();serving.get(2,TimeUnit.SECONDS);return result;
            }
        }
    }
    public String udpLoopback(String value) throws IOException {
        try(DatagramSocket receiver=new DatagramSocket(0,InetAddress.getLoopbackAddress());
            DatagramSocket sender=new DatagramSocket()) {
            receiver.setSoTimeout(2000);
            byte[] payload=value.getBytes(StandardCharsets.UTF_8);
            if(payload.length>512) throw new IllegalArgumentException("Payload too large");
            sender.send(new DatagramPacket(payload,payload.length,InetAddress.getLoopbackAddress(),receiver.getLocalPort()));
            byte[] buffer=new byte[512];var packet=new DatagramPacket(buffer,buffer.length);
            receiver.receive(packet);
            return new String(packet.getData(),packet.getOffset(),packet.getLength(),StandardCharsets.UTF_8);
        }
    }
    public int selectorReadiness() throws IOException {
        try(Selector selector=Selector.open();ServerSocketChannel server=ServerSocketChannel.open()) {
            server.bind(new InetSocketAddress(InetAddress.getLoopbackAddress(),0));
            server.configureBlocking(false);server.register(selector,SelectionKey.OP_ACCEPT);
            try(SocketChannel client=SocketChannel.open(server.getLocalAddress())) {
                if(selector.select(2000)==0) throw new SocketTimeoutException();
                try(SocketChannel accepted=server.accept()) { return selector.selectedKeys().size(); }
            }
        }
    }
    public String legacyGet(URI uri) throws IOException {
        HttpURLConnection connection=(HttpURLConnection)uri.toURL().openConnection();
        connection.setConnectTimeout(2000);connection.setReadTimeout(2000);connection.setInstanceFollowRedirects(false);
        try(InputStream input=connection.getInputStream()) { return new String(input.readAllBytes(),StandardCharsets.UTF_8); }
        finally { connection.disconnect(); }
    }
    public String postJson(URI uri,String json) throws Exception {
        try(HttpClient client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).followRedirects(HttpClient.Redirect.NEVER).build()) {
            var request=HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(2)).header("Content-Type","application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(json)).build();
            return client.sendAsync(request,HttpResponse.BodyHandlers.ofString()).get(3,TimeUnit.SECONDS).body();
        }
    }
}
