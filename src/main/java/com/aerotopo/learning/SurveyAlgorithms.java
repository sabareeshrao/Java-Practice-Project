package com.aerotopo.learning;
import java.util.*;
import java.util.stream.*;

/** Standard interview algorithms, exercised with survey tile IDs and QA flags. */
public final class SurveyAlgorithms {
    public static int[] unique(int[] ids) { return Arrays.stream(ids).distinct().toArray(); }
    public static int[] mergeSorted(int[] first,int[] second) { return IntStream.concat(Arrays.stream(first),Arrays.stream(second)).sorted().toArray(); }
    public static void moveZerosRight(int[] values) {
        int write=0;
        for(int value:values) if(value!=0) values[write++]=value;
        Arrays.fill(values,write,values.length,0);
    }
    public static int deduplicateSorted(int[] values) {
        int write=0;
        for(int value:values) if(write==0 || values[write-1]!=value) values[write++]=value;
        return write;
    }
    public static void binaryFlags(int[] flags) {
        int zero=0;
        for(int value:flags) { if(value!=0 && value!=1) throw new IllegalArgumentException(); if(value==0) zero++; }
        Arrays.fill(flags,0,zero,0); Arrays.fill(flags,zero,flags.length,1);
    }
    public static String reverse(String comment) { return new StringBuilder(comment).reverse().toString(); }
    public static Map<String,List<String>> anagrams(List<String> tileLabels) {
        return tileLabels.stream().collect(Collectors.groupingBy(s -> {
            char[] chars=s.toCharArray(); Arrays.sort(chars); return new String(chars);
        },LinkedHashMap::new,Collectors.toList()));
    }
    public static int indexOf(String text,String part) {
        outer: for(int i=0;i<=text.length()-part.length();i++) {
            for(int j=0;j<part.length();j++) if(text.charAt(i+j)!=part.charAt(j)) continue outer;
            return i;
        }
        return -1;
    }
    public static OptionalInt firstUniqueCodePoint(String label) {
        var counts=new LinkedHashMap<Integer,Integer>();
        label.codePoints().forEach(c -> counts.merge(c,1,Integer::sum));
        return counts.entrySet().stream().filter(e -> e.getValue()==1).mapToInt(Map.Entry::getKey).findFirst();
    }
    public static String expandRuns(String encoded,int maxLength) {
        var output=new StringBuilder();
        long count=0;
        boolean digits=false;
        for(char c:encoded.toCharArray()) {
            if(c>='0' && c<='9') { count=Math.addExact(Math.multiplyExact(count,10),c-'0'); digits=true; }
            else {
                if(!digits || count>maxLength-output.length()) throw new IllegalArgumentException("Invalid or oversized run");
                output.append(String.valueOf(c).repeat((int)count)); count=0; digits=false;
            }
        }
        if(digits) throw new IllegalArgumentException("Missing run symbol");
        return output.toString();
    }
    public static String longestPalindrome(String value) {
        int start=0,length=0;
        for(int center=0;center<value.length();center++) for(int parity=0;parity<2;parity++) {
            int left=center,right=center+parity;
            while(left>=0 && right<value.length() && value.charAt(left)==value.charAt(right)) { left--;right++; }
            if(right-left-1>length) { start=left+1; length=right-left-1; }
        }
        return value.substring(start,start+length);
    }
    public static boolean prime(int value) {
        if(value<2) return false;
        for(int divisor=2;divisor<=value/divisor;divisor++) if(value%divisor==0) return false;
        return true;
    }
    public static long factorial(int count) {
        if(count<0 || count>20) throw new IllegalArgumentException("Use 0..20");
        return count<2?1:Math.multiplyExact(count,factorial(count-1));
    }
    public static int binarySearch(int[] sorted,int target) {
        int low=0,high=sorted.length-1;
        while(low<=high) {
            int middle=low+(high-low)/2;
            if(sorted[middle]==target) return middle;
            if(sorted[middle]<target) low=middle+1; else high=middle-1;
        }
        return -1;
    }
    public static List<Integer> topDistinctElevations(int[] heights,int limit) {
        return Arrays.stream(heights).boxed().distinct().sorted(Comparator.reverseOrder()).limit(limit).toList();
    }
}
