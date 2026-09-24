package com.aerotopo.domain;

import java.util.EnumSet;

public enum SurveyStatus {
    PLANNED, INGESTED, PROCESSING, QA_READY, APPROVED, DELIVERED, FAILED;

    public boolean canTransitionTo(SurveyStatus next) {
        return switch (this) {
            case PLANNED -> next == INGESTED;
            case INGESTED -> next == PROCESSING;
            case PROCESSING -> EnumSet.of(QA_READY, FAILED).contains(next);
            case QA_READY -> EnumSet.of(APPROVED, INGESTED).contains(next);
            case APPROVED -> next == DELIVERED;
            case FAILED -> next == INGESTED;
            case DELIVERED -> false;
        };
    }
}
