import module java.base;

class SurveyBase {
    final String id;
    SurveyBase(String id) { this.id=id; }
}
class Flight extends SurveyBase {
    Flight(String id) {
        if(id.isBlank()) throw new IllegalArgumentException("Blank flight ID");
        super(id);
    }
}
public class ModernSurvey {
    public static void main(String[] args) {
        var flight=new Flight("FLIGHT-01");
        int count=0;
        for(var _ : List.of("tile-1","tile-2")) count++;
        if(count!=2) throw new AssertionError();
        System.out.println(flight.id + ": " + count + " tiles");
    }
}
