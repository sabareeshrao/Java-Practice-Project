package com.aerotopo.learning;
import java.math.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.*;

public final class UtilityLab {
    private static final Pattern TILE=Pattern.compile("(?<project>[A-Z]{2,8})-(?<number>[0-9]{1,6})");
    public record TileId(String project,int number) {}
    public Optional<TileId> parse(String text) {
        Matcher matcher=TILE.matcher(text);
        return matcher.matches()?Optional.of(new TileId(matcher.group("project"),Integer.parseInt(matcher.group("number")))):Optional.empty();
    }
    public BigDecimal quote(BigDecimal hectares,BigDecimal rate) {
        if(hectares.signum()<0 || rate.signum()<0) throw new IllegalArgumentException();
        return hectares.multiply(rate).setScale(2,RoundingMode.HALF_UP);
    }
    public BigInteger possibleMasks(int layers) { if(layers<0 || layers>100000) throw new IllegalArgumentException(); return BigInteger.TWO.pow(layers); }
    public String localCapture(Instant captured,ZoneId zone) { return DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(captured.atZone(zone)); }
    public Duration processingTime(Instant start,Instant end) { return Duration.between(start,end); }
    public LocalDate contractEnd(LocalDate start,Period term) { return start.plus(term); }
    public String localizedArea(double hectares,Locale locale) { return String.format(locale,"%.2f ha",hectares); }
    public String message(Locale locale,String key) { return ResourceBundle.getBundle("messages",locale).getString(key); }
    public List<String> scannerRows(String content) {
        var result=new ArrayList<String>();
        try(var scanner=new Scanner(content)) {
            int count=scanner.nextInt(); scanner.nextLine();
            for(int i=0;i<count && scanner.hasNextLine();i++) result.add(scanner.nextLine());
        }
        return List.copyOf(result);
    }
}
