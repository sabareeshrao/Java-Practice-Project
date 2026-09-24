module com.aerotopo.provider {
    requires com.aerotopo.spi;
    provides com.aerotopo.spi.DatumProvider with com.aerotopo.provider.Wgs84;
    opens com.aerotopo.provider to com.aerotopo.app;
}
