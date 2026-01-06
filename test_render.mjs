
import { renderRow } from './js/render.js';

const mockRow = {
    set innerHTML(val) {
        this._html = val;
    },
    get innerHTML() {
        return this._html;
    }
};

const testCases = [
    { classification: "Familie", expectedIcon: "🟢", expectedLabel: "Familie" },
    { classification: "Genuss", expectedIcon: "🟡", expectedLabel: "Genuss" },
    { classification: "Sportlich", expectedIcon: "🔴", expectedLabel: "Sportlich" },
    { classification: "Großraum", expectedIcon: "🔴", expectedLabel: "Großraum" },
    { classification: "Gletscher", expectedIcon: "⚫", expectedLabel: "Gletscher" },
];

console.log("Starting Verification...");

let allPassed = true;

testCases.forEach(test => {
    const data = {
        id: "test",
        name: "Test Resort",
        classification: test.classification,
        status: "static_only"
    };

    renderRow(mockRow, data);
    const html = mockRow.innerHTML;

    // Check for correct icon and label
    const hasIcon = html.includes(test.expectedIcon);
    const hasLabel = html.includes(test.expectedLabel);

    if (hasIcon && hasLabel) {
        console.log(`[PASS] ${test.classification}: Found ${test.expectedIcon} and '${test.expectedLabel}'`);
    } else {
        console.error(`[FAIL] ${test.classification}: Expected ${test.expectedIcon} and '${test.expectedLabel}'. Got: ...`);
        console.log(html);
        allPassed = false;
    }
});

if (allPassed) {
    console.log("All verifications passed!");
} else {
    console.error("Some verifications failed.");
    process.exit(1);
}
