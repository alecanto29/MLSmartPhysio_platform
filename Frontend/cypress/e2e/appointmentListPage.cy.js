describe('Pagina Calendario Appuntamenti', () => {
    const fakeAppointments = [
        {
            _id: '1',
            date: '2025-08-01T00:00:00.000Z',
            time: '10:00',
            notes: 'Controllo annuale',
            patient: { name: 'Mario', surname: 'Rossi' }
        },
        {
            _id: '2',
            date: '2025-08-02T00:00:00.000Z',
            time: '11:00',
            notes: '',
            patient: { name: 'Luigi', surname: 'Verdi' }
        }
    ];

    beforeEach(() => {
        cy.intercept('GET', '**/smartPhysio/appointments', {
            statusCode: 200,
            body: fakeAppointments
        }).as('getAppointments');

        cy.visit('/appointments');
        cy.wait('@getAppointments');
    });

    it('Dovrebbe mostrare il titolo "Lista Appuntamenti"', () => {
        cy.contains('Lista Appuntamenti', { timeout: 6000 }).should('exist');
    });

    it('Dovrebbe mostrare il pulsante "Prenota nuovo appuntamento"', () => {
        cy.contains('Prenota nuovo appuntamento').should('exist');
    });

    it('Dovrebbe mostrare gli appuntamenti caricati nel calendario', () => {
        cy.contains('Mario Rossi').should('exist');
        cy.contains('Luigi Verdi').should('exist');
    });

    it('Dovrebbe aprire il popup con i dettagli appuntamento', () => {
        cy.contains('Mario Rossi').click();
        cy.contains('Dettagli Appuntamento').should('exist');
        cy.contains('Data:').should('exist');
        cy.contains('Ora:').should('exist');
        cy.contains('Note:').should('exist');
    });

    it('Dovrebbe eliminare un appuntamento e mostrare il messaggio di successo', () => {
        cy.contains('Luigi Verdi').click();

        cy.intercept('DELETE', '**/smartPhysio/appointments/2', {
            statusCode: 200
        }).as('deleteAppointment');

        cy.get('button[aria-label="delete"]').click();
        cy.wait('@deleteAppointment');

        cy.contains('Appuntamento eliminato con successo').should('exist');
        cy.contains('Luigi Verdi').should('not.exist');
    });
});
