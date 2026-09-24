package com.aerotopo.app;
import com.aerotopo.spi.DatumProvider;
import java.util.ServiceLoader;
public final class Main {
    public static void main(String[] args) {
        var names=ServiceLoader.load(DatumProvider.class).stream().map(provider -> provider.get().name()).toList();
        if(!names.equals(java.util.List.of("WGS84"))) throw new AssertionError(names);
        System.out.println(names);
    }
}
