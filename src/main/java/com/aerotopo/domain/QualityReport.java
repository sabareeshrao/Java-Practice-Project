package com.aerotopo.domain;

import java.util.List;

public record QualityReport(int pointCount, int duplicateIds, double minElevation,
                            double maxElevation, double verticalRmse, List<String> issues) {
    public QualityReport { issues = List.copyOf(issues); }
    public boolean passed() { return issues.isEmpty(); }
}
