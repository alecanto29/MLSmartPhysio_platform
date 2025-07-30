describe('Pagina Prenotazione Appuntamento', () => {
    const mockPatients = [
        {
            _id: "p1",
            name: "Anna",
            surname: "Bianchi",
            birthDate: "1990-03-12T00:00:00.000Z",
            fiscalCode: "BNCHAN90C52Z404X"
        },
        {
            _id: "p2",
            name: "Marco",
            surname: "Rossi",
            birthDate: "1985-07-20T00:00:00.000Z",
            fiscalCode: "RSSMRC85L20F205Z"
        }
    ];

    beforeEach(() => {
        cy.intercept("GET", "**/smartPhysio/patient", {
            statusCode: 200,
            body: mockPatients
        }).as("getPatients");

        cy.visit("/takeappointments");
        cy.wait("@getPatients");
    });

    it('Dovrebbe mostrare il titolo "Lista Pazienti"', () => {
        cy.contains("Lista Pazienti").should("exist");
    });

    it("Dovrebbe filtrare i pazienti tramite la barra di ricerca", () => {
        cy.get("input[placeholder*='Cerca']").type("Anna");
        cy.contains("Anna Bianchi").should("exist");
        cy.contains("Marco Rossi").should("not.exist");
    });

    it("Dovrebbe aprire il popup e prenotare un appuntamento", () => {
        cy.get(".patient-card").contains("Anna Bianchi").parents(".patient-card").within(() => {
            cy.contains("Prenota").click();
        });

        // Fix del controllo del popup
        cy.contains("Nuovo Appuntamento").should("exist");

        cy.get('input[type="date"]').type("2025-08-10");
        cy.get('input[type="time"]').type("14:30");
        cy.get("textarea").type("Visita di controllo");

        cy.intercept("POST", "**/smartPhysio/appointments/newAppointments", {
            statusCode: 200
        }).as("postAppointment");

        cy.contains("Conferma").click();
        cy.wait("@postAppointment");

        cy.contains("Appuntamento prenotato con successo").should("exist");
    });


    it("Dovrebbe mostrare messaggio se nessun paziente è trovato", () => {
        cy.get("input[placeholder]").type("NonEsiste");
        cy.contains("Nessun paziente trovato").should("exist");
    });
});
