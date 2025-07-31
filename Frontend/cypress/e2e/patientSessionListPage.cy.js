describe("PatientSessionListPage", () => {
    const sessionsMock = [
        {
            _id: "sess1",
            date: "2024-07-20T10:00:00.000Z",
            patient: {
                _id: "patient123",
            },
        },
        {
            _id: "sess2",
            date: "2024-07-21T11:00:00.000Z",
            patient: {
                _id: "patient123",
            },
        },
    ];

    beforeEach(() => {
        cy.intercept("GET", "/smartPhysio/sessions/patient/patient123", {
            statusCode: 200,
            body: sessionsMock,
        }).as("getSessions");

        // Intercetta DELETE e download per evitare errori
        cy.intercept("DELETE", /\/smartPhysio\/(semg|inertial|sessions)\/.*/, {
            statusCode: 200,
        }).as("deleteSession");

        cy.intercept("GET", /\/smartPhysio\/(semg|inertial)\/export\/csv\/.*/, {
            statusCode: 200,
            body: new Blob(["csv content"], { type: "text/csv" }),
        }).as("downloadCsv");

        localStorage.setItem("token", "fake-jwt-token");

        cy.visit("/patient-session/patient123");
        cy.wait("@getSessions");
    });

    it("Should display all patient sessions", () => {
        cy.contains("Lista Sessioni Paziente");
        cy.contains("Sessione 1 - 20/07/2024");
        cy.contains("Sessione 2 - 21/07/2024");
    });

    it("Should navigate to session details", () => {
        cy.get(".card-action span").contains("Dettagli sessione").click();
        cy.url().should("include", "/session/details/sess1");
    });

    it("Should navigate to session analysis", () => {
        cy.get(".card-action span").contains("Analisi Sessione").click();
        cy.url().should("include", "/session/analysis/sess1");
    });

    it("Should trigger CSV download", () => {
        cy.get(".card-action span").contains("Scarica Sessione").click();
        cy.wait("@downloadCsv");
    });

    it("Should delete a session after confirmation", () => {
        cy.get(".delete-icon").first().click();
        cy.contains("Sei sicuro di voler eliminare questa sessione?");
        cy.get(".btn-delete").click();
        cy.wait("@deleteSession");
        cy.contains("Sessione cancellata con successo").should("exist");
    });

    it("Should cancel deletion via popup", () => {
        cy.get(".delete-icon").first().click();
        cy.get(".btn-close").click();
        cy.get(".popup-overlay").should("not.exist");
    });

    it("Should show no results if filter does not match", () => {
        cy.get("input").type("NonEsiste");
        cy.contains("Nessuna sessione trovata");
    });

    it("Should go back to patients list", () => {
        cy.get(".back-icon").click();
        cy.url().should("include", "/patients-list");
    });
});
