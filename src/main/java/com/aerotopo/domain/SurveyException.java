package com.aerotopo.domain;

public class SurveyException extends RuntimeException {
    public enum Kind { NOT_FOUND, CONFLICT, INVALID }
    private final Kind kind;
    public SurveyException(Kind kind, String message) { super(message); this.kind = kind; }
    public Kind kind() { return kind; }
}
