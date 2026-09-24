import java.lang.foreign.*;
import java.nio.ByteOrder;

public class ForeignElevation {
    public static void main(String[] args) {
        MemorySegment segment;
        try(Arena arena=Arena.ofConfined()) {
            segment=arena.allocate(3*Double.BYTES,Double.BYTES);
            var layout=ValueLayout.JAVA_DOUBLE.withOrder(ByteOrder.nativeOrder());
            segment.setAtIndex(layout,0,510.0);
            segment.setAtIndex(layout,1,510.1);
            segment.setAtIndex(layout,2,510.2);
            double average=(segment.getAtIndex(layout,0)+segment.getAtIndex(layout,1)+segment.getAtIndex(layout,2))/3;
            if(Math.abs(average-510.1)>1e-9) throw new AssertionError();
            System.out.println(average);
        }
        try { segment.get(ValueLayout.JAVA_DOUBLE,0);throw new AssertionError("Arena should be closed"); }
        catch(IllegalStateException expected) { System.out.println("Arena lifetime enforced"); }
    }
}
