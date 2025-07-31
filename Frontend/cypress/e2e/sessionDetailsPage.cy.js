describe("SessionDetailsPage", () => {
    const sessionMock = {
        _id: "abc123",
        date: "2024-07-20T12:00:00.000Z",
        notes: "Initial notes about the session.",
        patient: {
            _id: "patient123",
            name: "Luca",
            surname: "Verdi"
        },
        doctor: {
            name: "Anna",
            surname: "Neri"
        }
    };

    beforeEach(() => {
        cy.intercept("GET", "/smartPhysio/sessions/abc123", {
            statusCode: 200,
            body: sessionMock
        }).as("getSession");

        cy.intercept("PUT", "/smartPhysio/sessions/abc123", {
            statusCode: 200
        }).as("updateSession");

        window.localStorage.setItem("token", "fake-jwt-token");

        cy.visit("/session/details/abc123", {
            state: { patientId: "patient123" }
        });

        cy.wait("@getSession");
    });

    it("Should display session details correctly", () => {
        cy.contains("Dettagli Sessione"); // italiano
        cy.contains("Luca Verdi");
        cy.contains("Anna Neri");
        cy.contains("Initial notes about the session.");
        cy.contains(new Date(sessionMock.date).toLocaleDateString());
    });

    it("Should enter edit mode and update notes", () => {
        cy.get(".session-edit-icon").click();

        cy.get("textarea[name='notes']")
            .clear()
            .type("Updated session notes.");

        cy.get(".session-save-button").click();

        cy.wait("@updateSession").its("request.body.notes").should("eq", "Updated session notes.");

        // Italiano: "Dati sessione aggiornati"
        cy.contains("Dati sessione aggiornati", { timeout: 5000 }).should("be.visible");
    });

    it("Should navigate back to patient session list", () => {
        cy.get(".session-back-icon").click();
        cy.url().should("include", "/patient-session/patient123");
    });
});
