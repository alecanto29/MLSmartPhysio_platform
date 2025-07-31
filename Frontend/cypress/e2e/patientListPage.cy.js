describe("PatientListPage – Icon click navigation", () => {
    beforeEach(() => {
        cy.intercept("GET", "/smartPhysio/patient", {
            body: [
                {
                    _id: "1",
                    name: "Mario",
                    surname: "Rossi",
                    dateOfBirth: "1990-01-01",
                    fiscalCode: "RSSMRA90A01H501Z",
                }
            ]
        }).as("getPatients");

        cy.intercept("POST", "/smartPhysio/sessions", {
            statusCode: 200,
            body: { _id: "mockedSessionId" }
        }).as("createSession");

        window.localStorage.setItem("token", "mockedToken");
        cy.visit("/patients-list");
        cy.wait("@getPatients");
    });

    it("Should navigate to patient details page on details icon click", () => {
        cy.get(".card-action span").eq(0).click();
        cy.url().should("include", "/patient-details/");
    });

    it("Should create session and navigate on register icon click", () => {
        cy.get(".card-action span").eq(2).click();
        cy.url().should("include", "/patient-session/1");
    });

    it("Should navigate to home when clicking home icon", () => {
        cy.get(".home-icon").click();
        cy.url().should("include", "/doctor");
    });
});
