package com.aerotopo.learning;

import java.util.*;

/** Executable language experiments use survey tile IDs and quality flags. */
public final class LanguageLab {
    public static final int VALID = 0b0001;
    public static final int GROUND = 0b0010;
    private static int batches;
    private int accepted;
    static { batches = 0; }

    public record Snapshot(int flags, int accepted, int batches, String label) {}
    public Snapshot classify(int[] codes) {
        batches++;
        int flags = VALID | GROUND;
        for (int code : codes) {
            if (code < 0) continue;
            if (code == 0) break;
            accepted++;
        }
        String label;
        if (accepted == 0) label = "empty";
        else if (accepted < 10) label = "small";
        else label = "large";
        return new Snapshot(flags & VALID, accepted, batches, label);
    }
    public static int sum(int... tileCounts) {
        int total = 0;
        for (int count : tileCounts) total = Math.addExact(total, count);
        return total;
    }
    public static List<Integer> numericConversions(double metres) {
        int truncated = (int)metres;
        byte wrapped = (byte)truncated;
        long widened = truncated;
        return List.of(truncated, (int)wrapped, (int)widened, Integer.parseInt(Integer.toString(truncated)));
    }
    public static Map<String, Object> operators(int flags) {
        int before = flags++;
        int after = ++flags;
        return Map.of("postfix", before, "prefix", after, "left", flags << 1,
                "signed", -8 >> 1, "unsigned", -8 >>> 1, "xor", flags ^ GROUND,
                "ternary", (flags & VALID) != 0 ? "valid" : "invalid");
    }
    public static int switchFallThrough(int severity) {
        int escalation = 0;
        switch (severity) {
            case 3: escalation += 100;
            case 2: escalation += 10;
            case 1: escalation += 1; break;
            default: escalation = -1;
        }
        return escalation;
    }
    public static int scanGrid(int[][] grid) {
        int found = -1;
        search: for (int row=0;row<grid.length;row++) {
            int column = 0;
            while (column < grid[row].length) {
                if (grid[row][column] < 0) { found = row; break search; }
                column++;
            }
        }
        return found;
    }
    public static void reassign(List<String> ids) { ids = new ArrayList<>(); ids.add("local"); }
    public static void mutate(List<String> ids) { ids.add("GCP"); }
    public static boolean shortCircuit(List<String> values) { return values != null && !values.isEmpty(); }
    public static boolean eagerBoolean(boolean first, java.util.function.BooleanSupplier second) { return first & second.getAsBoolean(); }
    public static int doWhileCount(int limit) { int i = 0; do { i++; } while(i < limit); return i; }
    public static String format(Object value) {
        return switch (value) {
            case null -> "missing";
            case Integer count when count < 0 -> "invalid";
            case Integer count -> "points=" + count;
            case String label -> label.strip();
            default -> value.toString();
        };
    }
    public static String join(String prefix, int number) { return prefix + number; }
    public static String join(String prefix, Integer number) { return prefix + (number == null ? "missing" : number); }
}
