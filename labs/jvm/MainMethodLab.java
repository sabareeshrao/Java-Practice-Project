public class MainMethodLab {
    public static void main(String[] args) {
        System.out.println("standard main");
    }

    public static void main(int value) {
        System.out.println("int overload: " + value);
    }

    public static void main(String value) {
        System.out.println("string overload: " + value);
    }
}
