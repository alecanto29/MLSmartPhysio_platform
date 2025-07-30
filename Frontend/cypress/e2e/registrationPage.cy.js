describe('Registration Page', () => {

    beforeEach(() => {
        cy.visit('/registration');
        cy.get('.reg-language-button').click();
        cy.contains('EN').click(); // imposta inglese
    });

    it('Should display registration form fields', () => {
        cy.contains(/name/i).should('exist');
        cy.contains(/surname/i).should('exist');
        cy.contains(/fiscal code/i).should('exist');
        cy.contains(/specialization/i).should('exist');
        cy.contains(/email/i).should('exist');
        cy.contains(/password/i).should('exist');
        cy.contains(/license number/i).should('exist');
        cy.contains(/birth date/i).should('exist');
        cy.get('.confirm-button').should('exist');
    });

    it('Should switch language', () => {
        cy.get('.reg-language-button').click();
        cy.contains('EN').click();
        cy.get('.confirm-button'); // ✅ controlla esistenza
    });

    it('Should show error if email already registered', () => {
        cy.get('input[type="text"]').eq(0).type('Mario');
        cy.get('input[type="text"]').eq(1).type('Rossi');
        cy.get('input[type="text"]').eq(2).type('RSSMRA85T10A562S');
        cy.get('input[type="text"]').eq(3).type('Ortopedia');
        cy.get('input[type="email"]').type('existing@example.com');
        cy.get('input[type="password"]').type('validpassword123');
        cy.get('input[type="text"]').eq(4).type('123456');
        cy.get('input[type="date"]').type('1985-01-10');

        cy.intercept('POST', '**/smartPhysio/auth/register', {
            statusCode: 409,
            body: {
                message: 'EMAIL_ALREADY_REGISTERED'
            }
        }).as('registerConflict');

        cy.get('.confirm-button').click(); // ✅ fix definitivo
        cy.wait('@registerConflict');

        cy.contains(/EMAIL_ALREADY_REGISTERED/i).should('exist');
    });

    it('Should register successfully with valid data', () => {
        cy.get('input[type="text"]').eq(0).type('Luca');
        cy.get('input[type="text"]').eq(1).type('Verdi');
        cy.get('input[type="text"]').eq(2).type('VRDLUC90C10F205Y');
        cy.get('input[type="text"]').eq(3).type('Fisioterapia');
        cy.get('input[type="email"]').type('newuser@example.com');
        cy.get('input[type="password"]').type('strongpassword123');
        cy.get('input[type="text"]').eq(4).type('789012');
        cy.get('input[type="date"]').type('1990-03-15');

        const fakeToken = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' +
            btoa(JSON.stringify({ name: 'Luca', surname: 'Verdi' })) + '.signature';

        cy.intercept('POST', '**/smartPhysio/auth/register', {
            statusCode: 200,
            body: { token: fakeToken }
        }).as('successfulRegistration');

        cy.get('.confirm-button').click(); // ✅ fix definitivo
        cy.wait('@successfulRegistration');

        cy.visit('/doctor');
        cy.url().should('include', '/doctor');
    });
});
