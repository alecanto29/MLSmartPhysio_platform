// cypress/e2e/session_analysis.cy.js

describe('SessionAnalysisPage', () => {
    const sessionId = 'test-session-id';
    const patientId = 'test-patient-id';

    beforeEach(() => {
        sessionStorage.setItem('patientId', patientId); // workaround per `state`

        cy.intercept('GET', `/smartPhysio/sessions/rawcsv/${sessionId}?dataType=sEMG`, {
            fixture: 'session_sEMG.csv',
        }).as('getSEMG');

        cy.intercept('POST', `/smartPhysio/sessions/export/${sessionId}`, {}).as('exportCSV');
        cy.intercept('DELETE', `/smartPhysio/sessions/clean/${sessionId}`, {}).as('deleteCSV');

        cy.visit(`/session/analysis/${sessionId}`);
    });

    it('visualizza la pagina e carica i dati sEMG', () => {
        cy.contains('Analisi Sessione');
        cy.wait('@getSEMG');
        cy.get('.graph-container').should('have.length.at.least', 1);
    });

    it('passa ai dati IMU e li carica', () => {
        cy.intercept('GET', `/smartPhysio/sessions/rawcsv/${sessionId}?dataType=IMU`, {
            fixture: 'session_IMU.csv',
        }).as('getIMU');

        cy.get('.session-data-dropdown').click();
        cy.contains('Dati IMU').click();

        cy.wait('@getIMU');
        cy.get('.graph-container').should('exist');
    });

    it('apre ed esegue la sezione pulizia dati', () => {
        cy.get('.accordion-button').contains('Pulizia dati').scrollIntoView().click({ force: true });
        cy.get('input[type="checkbox"]').first().check({ force: true });

        cy.intercept('POST', `/smartPhysio/clean/mean`, {}).as('cleanMean');

        cy.get('.start-button').scrollIntoView().click({ force: true });
        cy.wait('@cleanMean');
        cy.wait('@getSEMG');
    });

    it('esegue la normalizzazione', () => {
        cy.get('.accordion-button').contains('Normalizzazione dati').click();
        cy.get('input[type="checkbox"]').check({ multiple: true, force: true });

        cy.intercept('POST', `/smartPhysio/normalize/minmax`, {}).as('normMinMax');
        cy.intercept('POST', `/smartPhysio/normalize/standard`, {}).as('normStandard');

        cy.get('.start-button').click();
        cy.wait('@normMinMax');
        cy.wait('@normStandard');
        cy.wait('@getSEMG');
    });

    it('applica il filtraggio selettivo', () => {
        cy.get('.accordion-button').contains('Filtraggio selettivo').scrollIntoView().click({ force: true });

        cy.get('input[type="checkbox"]').first().check({ force: true });
        cy.get('input[type="number"]').eq(0).type('50', { force: true });
        cy.get('input[type="number"]').eq(1).type('2', { force: true });

        cy.intercept('POST', `/smartPhysio/filter/low`, {}).as('filterLow');

        cy.get('.start-button').scrollIntoView().click({ force: true });
        cy.wait('@filterLow');
        cy.wait('@getSEMG');
    });


    it('scarica il CSV cliccando su "Scarica il csv"', () => {
        cy.intercept('GET', `/smartPhysio/sessions/download/${sessionId}/sEMG`, {
            body: 'ch1,ch2,ch3\n1,2,3',
            headers: {
                'Content-Type': 'text/csv',
            },
        }).as('downloadCSV');

        cy.get('.session-options-dropdown').click();
        cy.contains('Scarica il csv').click();
        cy.wait('@downloadCSV');
    });

    it('resetta il CSV', () => {
        cy.intercept('POST', `/smartPhysio/sessions/export/${sessionId}`, {}).as('exportAfterReset');
        cy.get('.session-options-dropdown').click();
        cy.contains('Reset del csv').click();
        cy.wait('@exportAfterReset');
    });

});
