describe('DoctorMainPage', () => {
    beforeEach(() => {
        cy.intercept('GET', '/smartPhysio/patient', {
            statusCode: 200,
            body: [{ id: 1 }, { id: 2 }]
        }).as('getPatients');

        cy.intercept('GET', '/smartPhysio/patient/critical', {
            statusCode: 200,
            body: [{ id: 3 }]
        }).as('getCritical');

        cy.intercept('GET', '/smartPhysio/appointments', {
            statusCode: 200,
            body: [
                { id: 1, date: new Date().toISOString() },
                { id: 2, date: new Date().toISOString() }
            ]
        }).as('getAppointments');

        cy.visit('/doctor');
        cy.wait(['@getPatients', '@getCritical', '@getAppointments']);
    });

    it('Dovrebbe mostrare tutte le icone principali con testo corretto', () => {
        cy.get('.icon-box').should('have.length', 3);

        cy.get('.icon-box').eq(0).should('contain.text', 'Aggiungi Nuovo Paziente');
        cy.get('.icon-box').eq(1).should('contain.text', 'Lista Pazienti');
        cy.get('.icon-box').eq(2).should('contain.text', 'Appuntamenti');
    });

    it('Click su "Aggiungi paziente" reindirizza correttamente', () => {
        cy.get('.icon-box').eq(0).click();
        cy.location('pathname').should('eq', '/add-patient');
    });

    it('Click su "Lista pazienti" reindirizza correttamente', () => {
        cy.get('.icon-box').eq(1).click();
        cy.location('pathname').should('eq', '/patients-list');
    });

    it('Click su "Calendario appuntamenti" reindirizza correttamente', () => {
        cy.get('.icon-box').eq(2).click();
        cy.location('pathname').should('eq', '/appointments');
    });
});
