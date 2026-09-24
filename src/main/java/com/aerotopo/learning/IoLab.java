package com.aerotopo.learning;

import com.aerotopo.domain.SurveyPoint;
import java.io.*;
import java.nio.*;
import java.nio.channels.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

public final class IoLab {
    public byte[] serialize(SurveyPoint point) throws IOException {
        var bytes=new ByteArrayOutputStream();
        try(var output=new ObjectOutputStream(bytes)) { output.writeObject(point); }
        return bytes.toByteArray();
    }
    public SurveyPoint deserialize(byte[] bytes) throws IOException,ClassNotFoundException {
        if(bytes.length>4096) throw new InvalidObjectException("Oversized serialized point");
        try(var input=new ObjectInputStream(new ByteArrayInputStream(bytes))) {
            input.setObjectInputFilter(ObjectInputFilter.Config.createFilter("maxdepth=5;maxrefs=20;com.aerotopo.domain.SurveyPoint;!*"));
            return (SurveyPoint)input.readObject();
        }
    }
    public static final class Session implements Serializable {
        private static final long serialVersionUID=1L;
        public final String surveyId;
        public transient String token;
        public Session(String surveyId,String token) { this.surveyId=surveyId;this.token=token; }
    }
    public double binaryElevation(Path path,double value) throws IOException {
        ByteBuffer buffer=ByteBuffer.allocate(Double.BYTES).order(ByteOrder.LITTLE_ENDIAN);
        buffer.putDouble(value).flip();
        try(FileChannel channel=FileChannel.open(path,StandardOpenOption.CREATE,StandardOpenOption.TRUNCATE_EXISTING,StandardOpenOption.READ,StandardOpenOption.WRITE)) {
            while(buffer.hasRemaining()) channel.write(buffer);
            channel.force(true);
            buffer.clear();channel.position(0);
            while(buffer.hasRemaining()) if(channel.read(buffer)<0) throw new EOFException();
            buffer.flip();
            return buffer.getDouble();
        }
    }
    public byte mappedFirstByte(Path path) throws IOException {
        try(FileChannel channel=FileChannel.open(path,StandardOpenOption.READ)) {
            if(channel.size()==0) throw new EOFException();
            return channel.map(FileChannel.MapMode.READ_ONLY,0,channel.size()).get(0);
        }
    }
    public long lines(Path path) throws IOException {
        try(var lines=Files.lines(path,StandardCharsets.UTF_8)) { return lines.filter(s -> !s.isBlank()).count(); }
    }
    public void bufferedCopy(Path source,Path target) throws IOException {
        try(var input=new BufferedInputStream(new FileInputStream(source.toFile()));
            var output=new BufferedOutputStream(new FileOutputStream(target.toFile()))) { input.transferTo(output); }
    }
    public String fileReader(Path path) throws IOException {
        try(var reader=new FileReader(path.toFile(),StandardCharsets.UTF_8);var writer=new StringWriter()) {
            reader.transferTo(writer);return writer.toString();
        }
    }
    public WatchService watch(Path directory) throws IOException {
        WatchService watcher=FileSystems.getDefault().newWatchService();
        try { directory.register(watcher,StandardWatchEventKinds.ENTRY_CREATE);return watcher; }
        catch(IOException | RuntimeException failure) { watcher.close();throw failure; }
    }
    public static final class Resource implements AutoCloseable {
        private final String name;
        private final List<String> closed;
        public Resource(String name,List<String> closed) { this.name=name;this.closed=closed; }
        @Override public void close() throws IOException { closed.add(name);throw new IOException("close-"+name); }
    }
    public IOException suppressed(List<String> closed) {
        try(var first=new Resource("first",closed);var second=new Resource("second",closed)) {
            throw new IOException("processing");
        } catch(IOException failure) { return failure; }
    }
}
