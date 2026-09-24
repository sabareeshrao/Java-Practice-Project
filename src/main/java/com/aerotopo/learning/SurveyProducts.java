package com.aerotopo.learning;

import java.util.*;

/** OOP hierarchy plus composition: every product owns an immutable list of source tile IDs. */
public final class SurveyProducts {
    public interface Exportable {
        String export();
        default String mediaType() { return "text/plain"; }
        static boolean supports(String type) { return "text/plain".equals(type); }
    }
    public interface Identified { String id(); }
    public abstract static class Product implements Exportable, Identified {
        private final String id;
        private final List<String> tiles;
        protected Product(String id) { this(id, List.of()); }
        protected Product(String id, List<String> tiles) { this.id=Objects.requireNonNull(id); this.tiles=List.copyOf(tiles); }
        @Override public final String id() { return id; }
        public List<String> tiles() { return tiles; }
        public abstract double resolutionMetres();
        @Override public String export() { return id + "," + resolutionMetres() + "," + tiles.size(); }
        public static String category() { return "survey-product"; }
        @Override public boolean equals(Object o) { return o != null && getClass() == o.getClass() && id.equals(((Product)o).id); }
        @Override public int hashCode() { return Objects.hash(getClass(),id); }
        @Override public String toString() { return getClass().getSimpleName() + "[" + id + "]"; }
    }
    public static final class Orthomosaic extends Product {
        private final double gsd;
        public Orthomosaic(String id, List<String> tiles, double gsd) {
            super(id,tiles);
            if (!Double.isFinite(gsd) || gsd<=0) throw new IllegalArgumentException("Invalid GSD");
            this.gsd=gsd;
        }
        @Override public double resolutionMetres() { return gsd; }
        public static String category() { return "orthomosaic"; } // Hiding, not overriding.
        public Orthomosaic copy(String id) { return new Orthomosaic(id,tiles(),gsd); }
    }
    public static final class Dem extends Product {
        private final double cell;
        public Dem(String id,double cell) { super(id); if(cell<=0) throw new IllegalArgumentException(); this.cell=cell; }
        @Override public double resolutionMetres() { return cell; }
    }
    public static final class Builder {
        private String id;
        private double resolution=0.05;
        private final List<String> tiles=new ArrayList<>();
        public Builder id(String value) { id=value; return this; }
        public Builder resolution(double value) { resolution=value; return this; }
        public Builder tile(String value) { tiles.add(value); return this; }
        public Orthomosaic build() { return new Orthomosaic(id,tiles,resolution); }
    }
    public enum ProductFactory {
        INSTANCE;
        public Product create(String type,String id,double resolution) {
            return switch(type.toUpperCase(Locale.ROOT)) {
                case "DEM" -> new Dem(id,resolution);
                case "ORTHO" -> new Orthomosaic(id,List.of(),resolution);
                default -> throw new IllegalArgumentException("Unknown product: " + type);
            };
        }
    }
    public interface Left { default String units() { return "m"; } }
    public interface Right { default String units() { return "metres"; } }
    public static class Units implements Left,Right {
        @Override public String units() { return Left.super.units(); }
    }
    public sealed interface Result permits Success, Failure {}
    public record Success(Product product) implements Result {}
    public record Failure(String reason) implements Result {}
    public static String describe(Result result) {
        return switch(result) {
            case Success(Product product) -> product.export();
            case Failure(String reason) -> "Rejected: " + reason;
        };
    }
}
