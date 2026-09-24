package com.aerotopo.api;
import com.aerotopo.domain.SurveyException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.*;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.io.IOException;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(SurveyException.class)
    ProblemDetail survey(SurveyException e) {
        return ProblemDetail.forStatusAndDetail(switch(e.kind()) {
            case NOT_FOUND -> HttpStatus.NOT_FOUND;
            case CONFLICT -> HttpStatus.CONFLICT;
            case INVALID -> HttpStatus.BAD_REQUEST;
        }, e.getMessage());
    }
    @ExceptionHandler({IllegalArgumentException.class, IOException.class, ConstraintViolationException.class,
            MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    ProblemDetail invalid(Exception e) {
        String detail = e instanceof IllegalArgumentException || e instanceof IOException
                ? e.getMessage() : "Invalid request; check required fields and ranges";
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    }
    @ExceptionHandler({DataIntegrityViolationException.class, OptimisticLockingFailureException.class})
    ProblemDetail conflict(Exception e) { return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Data changed or conflicts with an existing record"); }
}
