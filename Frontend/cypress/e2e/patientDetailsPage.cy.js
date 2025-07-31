describe("PatientDetailsPage", () => {
    const patientMock = {
        id: "1",
        name: "Mario",
        surname: "Rossi",
        birthDate: "1980-01-01",
        gender: "Male",
        fiscalCode: "RSSMRA80A01H501U",
        healthCardNumber: "1234567890",
        medicalHistory: "Nessuna allergia",
        isCritical: false
    };

    beforeEach(() => {
        cy.intercept("GET", "/smartPhysio/patient/1", { statusCode: 200, body: patientMock }).as("getPatient");
        cy.intercept("PUT", "/smartPhysio/patient/1", { statusCode: 200 }).as("updatePatient");

        // Simula token JWT in localStorage
        window.localStorage.setItem("token", "fake-jwt-token");

        cy.visit("/patient-details/1"); // route che hai definito con id dinamico
        cy.wait("@getPatient");
    });

    it("Should display patient details correctly", () => {
        cy.contains("Mario Rossi");
        cy.contains("RSSMRA80A01H501U");
        cy.contains("Nessuna allergia");
    });

    it("Should switch to edit mode and modify name", () => {
        cy.get(".edit-icon").click();

        cy.get("input[name='name']").clear().type("Luigi");

        cy.get(".save-button").click();

        cy.wait("@updatePatient").its("request.body.name").should("eq", "Luigi");

        cy.contains("Dati paziente aggiornati").should("exist");
    });

    it("Should toggle criticality", () => {
        cy.get(".edit-icon").click();
        cy.get("input[name='isCritical'][value='true']").check({ force: true });
        cy.get(".save-button").click();
        cy.wait("@updatePatient").its("request.body.isCritical").should("eq", true);
    });

    it("Should go back when clicking back icon", () => {
        cy.get(".back-icon-container").click();
        cy.url().should("include", "/patients-list");
    });
});
