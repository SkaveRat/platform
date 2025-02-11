/// <reference types="Cypress" />

import ProductPageObject from '../../support/pages/module/sw-product.page-object';

describe('Product creation via API and commercial customer registration', () => {
    beforeEach(() => {
        cy.loginViaApi().then(() =>
            cy.createProductFixture());
    });

    it('@package: should order as commercial customer', () => {
        const page = new ProductPageObject();
        cy.intercept({
            url: `**/${Cypress.env('apiPath')}/_action/sync`,
            method: 'POST'
        }).as('saveProduct');
        cy.intercept({
            url: `**/${Cypress.env('apiPath')}/_action/system-config/batch`,
            method: 'POST'
        }).as('saveData');
        cy.intercept({
            url: `/account/register`,
            method: 'POST'
        }).as('registerCustomer');

        // Saleschannel initial settings
        cy.visit(`${Cypress.env('admin')}#/sw/settings/shipping/index`);
        cy.url().should('include', 'settings/shipping/index');
        cy.setShippingMethod('Express', '10', '8');
        cy.visit(`${Cypress.env('admin')}#/sw/settings/payment/index`);
        cy.url().should('include', 'settings/payment/index');
        cy.setPaymentMethod('Paid in advance');
        cy.visit(`${Cypress.env('admin')}#/sw/dashboard/index`);
        cy.url().should('include', 'dashboard/index');
        cy.goToSalesChannelDetail('E2E install test')
            .selectCountryForSalesChannel('Germany')
            .selectPaymentMethodForSalesChannel('Paid in advance')
            .selectShippingMethodForSalesChannel('Express');

        // Add product to sales channel
        cy.visit(`${Cypress.env('admin')}#/sw/product/index`);
        cy.clickContextMenuItem(
            '.sw-entity-listing__context-menu-edit-action',
            page.elements.contextMenuButton,
            `${page.elements.dataGridRow}--0`);
        cy.contains('h2', 'Product name');
        cy.get('.sw-product-detail__select-visibility').scrollIntoView().typeMultiSelectAndCheck('E2E install test');
        cy.get('.sw-button-process__content').click();
        cy.wait('@saveProduct').its('response.statusCode').should('equal', 200);
        cy.get('.sw-loader').should('not.exist');
        cy.get('.sw-button-process__content').contains('Opslaan');

        // Login/registration settings
        cy.visit(`${Cypress.env('admin')}#/sw/settings/login/registration/index`);
        cy.url().should('include', 'settings/login/registration/index');
        cy.get('.sw-system-config--field-core-login-registration-show-account-type-selection [type]').check();
        cy.get('.sw-button-process__content').click();
        cy.wait('@saveData').its('response.statusCode').should('equal', 204);
        cy.get('.sw-loader').should('not.exist');

        // Country settings
        cy.visit(`${Cypress.env('admin')}#/sw/settings/country/index`);
        cy.url().should('include', 'settings/country/index');
        cy.get('.sw-search-bar__input').typeAndCheckSearchField('Germany');
        cy.get(`.sw-data-grid__cell--name`).contains('Germany').click();
        cy.get('[name="sw-field--country-checkVatIdPattern"]').check();
        cy.get('[name="sw-field--country-vatIdRequired"]').check();
        cy.get('[name="sw-field--country-forceStateInRegistration"]').check();
        cy.get('.sw-button-process__content').click();
        cy.wait('@saveData').its('response.statusCode').should('equal', 204);
        cy.get('.sw-loader').should('not.exist');

        // Register as commercial customer
        cy.visit('/account/login');
        cy.url().should('include', '/account/login');
        cy.get('#accountType').select('Commercial');
        cy.get('#personalSalutation').select('Mr.');
        cy.get('#personalFirstName').typeAndCheckStorefront('Test');
        cy.get('#personalLastName').typeAndCheckStorefront('Tester');
        cy.get('#billingAddresscompany').typeAndCheckStorefront('shopware AG');
        cy.get('#billingAddressdepartment').typeAndCheckStorefront('QA');
        cy.get('#vatIds').typeAndCheckStorefront('DE123456789');
        cy.get('#personalMail').typeAndCheckStorefront('test6@tester.com');
        cy.get('#personalPassword').typeAndCheckStorefront('shopware');
        cy.get('#billingAddressAddressStreet').typeAndCheckStorefront('Test street');
        cy.get('#billingAddressAddressZipcode').typeAndCheckStorefront('12345');
        cy.get('#billingAddressAddressCity').typeAndCheckStorefront('Test city');
        cy.get('#billingAddressAddressCountry').select('Germany');
        cy.get('#billingAddressAddressCountryState').select('North Rhine-Westphalia');
        cy.get('.btn.btn-lg.btn-primary').click();
        cy.wait('@registerCustomer').its('response.statusCode').should('equal', 302);

        // Make an order
        cy.get('.header-search-input').type('Product name');
        cy.contains('.search-suggest-product-name', 'Product name').click();
        cy.get('.product-detail-buy .btn-buy').click();
        cy.get('.offcanvas.is-open').should('be.visible');
        cy.get('.cart-item-label').contains('Product name').should('be.visible');
        cy.get('.offcanvas-cart-actions [href="/checkout/cart"]').should('be.visible').click();
        cy.get('.cart-item-details-container [title]').contains('Product name').should('be.visible');
        cy.get('.cart-item-total-price.col-12.col-md-2.col-sm-4').contains('49,98').should('be.visible');
        cy.get('.col-5.checkout-aside-summary-total').contains('59,98').should('be.visible');
        cy.get('a[title="Proceed to checkout"]').should('be.visible').click();
        cy.get('.confirm-address').contains('Test Tester').should('be.visible');
        cy.get('.cart-item-label').contains('Product name').should('be.visible');
        cy.get('.cart-item-total-price').scrollIntoView();
        cy.get('.cart-item-total-price').contains('49,98').should('be.visible');
        cy.get('.col-5.checkout-aside-summary-total').contains('59,98').should('be.visible');
        cy.get('.confirm-tos .card-title').contains('Terms and conditions and cancellation policy').should('be.visible');
        cy.get('.confirm-tos .custom-checkbox label').scrollIntoView();
        cy.get('.confirm-tos .custom-checkbox label').should('be.visible').click(1, 1);
        cy.get('#confirmFormSubmit').scrollIntoView();
        cy.get('#confirmFormSubmit').click();
        cy.get('.finish-header').contains(`Thank you for your order with E2E install test!`).should('be.visible');

        // Verify order
        cy.visit('/account/order');
        cy.get('.order-item-header').contains('10000');
        cy.contains('View').click();
        cy.get('.order-item-total-value').contains('49,98');
        cy.get('.order-item-detail-summary').contains('59,98');
    });
});
