describe('Add Patient Page', () => {

    beforeEach(() => {
        cy.visit('/add-patient', {
            onBeforeLoad(win) {
                win.localStorage.setItem('i18nextLng', 'it'); // forza italiano
            }
        });
    });

    it('Dovrebbe mostrare tutti i campi del form paziente', () => {
        cy.contains('Nome').should('exist');
        cy.contains('Cognome').should('exist');
        cy.contains('Codice Fiscale').should('exist');
        cy.contains('Numero Tessera Sanitaria').should('exist');
        cy.contains('Anamnesi').should('exist');
        cy.contains('Data di Nascita').should('exist');
        cy.contains('Genere').should('exist');
        cy.contains('Conferma').should('exist');
    });

    it('Dovrebbe mostrare errore se il paziente esiste già', () => {
        cy.get('input').eq(0).type('Mario');                     // nome
        cy.get('input').eq(1).type('Rossi');                     // cognome
        cy.get('input').eq(2).type('RSSMRA85T10A562S');          // codice fiscale
        cy.get('input').eq(3).type('123456789');                 // tessera sanitaria
        cy.get('textarea').type('Operato al ginocchio');         // anamnesi
        cy.get('input[type="date"]').type('1980-12-15');         // data di nascita
        cy.get('input[type="radio"][value="Male"]').check();     // genere

        cy.intercept('POST', '**/smartPhysio/patient', {
            statusCode: 409,
            body: { message: 'EMAIL_ALREADY_REGISTERED' }
        }).as('addConflict');

        cy.contains('Conferma').click();
        cy.wait('@addConflict');


        cy.contains('EMAIL_ALREADY_REGISTERED').should('exist');
    });

    it('Dovrebbe aggiungere un paziente con dati validi', () => {
        cy.get('input').eq(0).type('Anna');                      // nome
        cy.get('input').eq(1).type('Bianchi');                   // cognome
        cy.get('input').eq(2).type('BNCHAN85A41F205Y');          // codice fiscale
        cy.get('input').eq(3).type('987654321');                 // tessera sanitaria
        cy.get('textarea').type('Diabete');                      // anamnesi
        cy.get('input[type="date"]').type('1995-06-20');         // data di nascita
        cy.get('input[type="radio"][value="Female"]').check();   // genere

        cy.intercept('POST', '**/smartPhysio/patient', {
            statusCode: 200,
            body: {}
        }).as('successfulAdd');

        cy.contains('Conferma').click();
        cy.wait('@successfulAdd');

        cy.url().should('include', '/doctor');
    });
});
