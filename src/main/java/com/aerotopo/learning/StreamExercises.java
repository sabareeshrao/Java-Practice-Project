package com.aerotopo.learning;
import java.util.*;
import java.util.function.Function;
import java.util.stream.*;

public final class StreamExercises {
    public record Surveyor(String name,long dailyRate) {}
    public Optional<String> secondHighestRate(List<Surveyor> staff) {
        var second=staff.stream().map(Surveyor::dailyRate).distinct().sorted(Comparator.reverseOrder()).skip(1).findFirst();
        return second.flatMap(rate -> staff.stream().filter(s -> s.dailyRate()==rate).map(Surveyor::name).sorted().findFirst());
    }
    public long ratesAbove(List<Surveyor> staff,long threshold) { return staff.stream().filter(s -> s.dailyRate()>threshold).count(); }
    public double averageRate(List<Surveyor> staff) { return staff.stream().mapToLong(Surveyor::dailyRate).average().orElse(0); }
    public Map<Integer,Long> frequency(List<Integer> ids) { return ids.stream().collect(Collectors.groupingBy(Function.identity(),LinkedHashMap::new,Collectors.counting())); }
    public List<Integer> duplicates(List<Integer> ids) { return frequency(ids).entrySet().stream().filter(e -> e.getValue()>1).map(Map.Entry::getKey).toList(); }
    public List<Integer> onlyUnique(List<Integer> ids) { return frequency(ids).entrySet().stream().filter(e -> e.getValue()==1).map(Map.Entry::getKey).toList(); }
    public List<Integer> mostFrequent(List<Integer> ids,int k) {
        return frequency(ids).entrySet().stream().sorted(Map.Entry.<Integer,Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey())).limit(k).map(Map.Entry::getKey).toList();
    }
    public Optional<Integer> firstRepeating(List<Integer> ids) {
        Set<Integer> seen=new HashSet<>();
        // Sequential encounter order is essential; stateful predicate is unsuitable for parallel execution.
        return ids.stream().filter(id -> !seen.add(id)).findFirst();
    }
    public long sum(List<Integer> ids) { return ids.stream().mapToLong(Integer::longValue).sum(); }
    public long oddSquares(List<Integer> ids) { return ids.stream().filter(n -> n%2!=0).mapToLong(n -> (long)n*n).sum(); }
    public long oddSum(List<Integer> ids) { return ids.stream().filter(n -> n%2!=0).mapToLong(Integer::longValue).sum(); }
    public long evenSum(List<Integer> ids) { return ids.stream().filter(n -> n%2==0).mapToLong(Integer::longValue).sum(); }
    public List<Integer> doubleEvens(List<Integer> ids) { return ids.stream().filter(n -> n%2==0).map(n -> Math.multiplyExact(n,2)).toList(); }
    public List<Integer> startingWithOne(List<Integer> ids) { return ids.stream().filter(n -> n.toString().startsWith("1")).toList(); }
    public List<Integer> highest(List<Integer> ids,int k) { return ids.stream().distinct().sorted(Comparator.reverseOrder()).limit(k).toList(); }
    public List<Integer> lowest(List<Integer> ids,int k) { return ids.stream().distinct().sorted().limit(k).toList(); }
    public Optional<Integer> nthHighest(List<Integer> ids,int n) {
        if(n<1) throw new IllegalArgumentException();
        return ids.stream().distinct().sorted(Comparator.reverseOrder()).skip(n-1).findFirst();
    }
    public List<String> titleCases(List<String> values) { return values.stream().map(this::titleCase).toList(); }
    public List<Integer> distinct(List<Integer> ids) { return ids.stream().distinct().toList(); }
    public String titleCase(String value) {
        return value.isEmpty()?value:value.substring(0,1).toUpperCase(Locale.ROOT)+value.substring(1).toLowerCase(Locale.ROOT);
    }
    public List<String> upper(List<String> labels) { return labels.stream().map(s -> s.toUpperCase(Locale.ROOT)).toList(); }
    public Map<Integer,Long> characterCounts(String text) { return text.codePoints().boxed().collect(Collectors.groupingBy(Function.identity(),LinkedHashMap::new,Collectors.counting())); }
    public Map<Integer,List<String>> byLength(List<String> labels) { return labels.stream().collect(Collectors.groupingBy(String::length)); }
    public Map<Boolean,List<Integer>> partitionEven(List<Integer> ids) { return ids.stream().collect(Collectors.partitioningBy(n -> n%2==0)); }
    public List<String> flatten(List<List<String>> flights) { return flights.stream().flatMap(Collection::stream).toList(); }
    public long numericCharacters(String label) { return label.codePoints().filter(Character::isDigit).count(); }
    public long alphabeticCharacters(String label) { return label.codePoints().filter(Character::isLetter).count(); }
    public String joined(List<String> labels) { return labels.stream().collect(Collectors.joining(",")); }
    public Optional<String> nthLongest(List<String> labels,int rank) {
        if(rank<1) throw new IllegalArgumentException();
        return labels.stream().sorted(Comparator.comparingInt(String::length).reversed().thenComparing(Function.identity())).skip(rank-1).findFirst();
    }
    public long primeSum(int limit) { return IntStream.rangeClosed(2,limit).filter(SurveyAlgorithms::prime).asLongStream().sum(); }
    public boolean palindrome(String text) {
        int[] chars=text.codePoints().toArray();
        return IntStream.range(0,chars.length/2).allMatch(i -> chars[i]==chars[chars.length-1-i]);
    }
    public List<String> palindromes(List<String> labels) { return labels.stream().filter(this::palindrome).toList(); }
    public int digitSum(long value) { return Long.toString(value).chars().filter(Character::isDigit).map(c -> c-'0').sum(); }
    public long streamFactorial(int n) { if(n<0 || n>20) throw new IllegalArgumentException(); return LongStream.rangeClosed(1,n).reduce(1,Math::multiplyExact); }
    public List<String> frequentWords(List<String> words) {
        return words.stream().collect(Collectors.groupingBy(Function.identity(),Collectors.counting())).entrySet().stream()
                .sorted(Map.Entry.<String,Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey())).limit(3).map(Map.Entry::getKey).toList();
    }
    public long fibonacci(int n) {
        if(n<0 || n>92) throw new IllegalArgumentException();
        long first=0,second=1;
        for(int i=0;i<n;i++) { long next=i==91?0:Math.addExact(first,second); first=second; second=next; }
        return first;
    }
    public int[] xorSwap(int first,int second) { first^=second; second^=first; first^=second; return new int[]{first,second}; }
}
