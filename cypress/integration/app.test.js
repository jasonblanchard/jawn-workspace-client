describe('/workspace', () => {
  it('renders entries', () => {
    cy.server();
    cy.route({
      method: 'POST',
      url: '/api/workspace/graphql/',
      status: 201,
      response: {
        data: {
          entries: [
            {
              id: '123',
              text: 'Sample Post\nThis is the body',
              timeCreated: '2018-01-03T02:25:28+00:00',
              timeUpdated: null,
            },
          ],
        },
      },
    });

    cy.visit('/workspace');
    cy.contains('Jawn');
    cy.get('nav').contains('Sample Post').click();
    cy.contains('This is the body');
  });

  it('can add entries', () => {
    cy.server();
    cy.route({
      method: 'POST',
      url: '/api/workspace/graphql/',
      status: 201,
      response: {
        data: {
          entries: []
        }
      }
    }).as('getEntries');

    cy.visit('/workspace');
    cy.wait('@getEntries');

    cy.route({
      method: 'POST',
      url: '/api/workspace/graphql/',
      status: 201,
      response: {
        data: {
          entry: {
            id: '567',
            text: '',
            timeUpdated: null,
            timeCreated: '2019-09-04T11:44:37+00:00',
          }
        }
      }
    }).as('createEntry');

    cy.contains('new').click();

    cy.wait('@createEntry');
    cy.url().should('include', 'workspace/567');
  });

  it('can update entries', () => {
    cy.server();
    cy.route({
      method: 'POST',
      url: '/api/workspace/graphql/',
      status: 201,
      response: {
        data: {
          entries: [
            {
              id: '123',
              text: 'Sample Post\nThis is the body',
              timeCreated: '2018-01-03T02:25:28+00:00',
              timeUpdated: null,
            },
          ],
        },
      },
    }).as('getEntries');

    cy.visit('/workspace');
    cy.wait('@getEntries');

    cy.get('nav').contains('Sample Post').click();

    cy.route({
      method: 'POST',
      url: '/api/workspace/graphql/',
      status: 200,
      response: {
        data: {
          entry: {
            id: '123',
            text: 'updated text',
            timeUpdated: '2019-09-04T11:49:06+00:00'
          }
        }
      }
    }).as('updateEntry');

    cy.get('textarea[name="text"]').type('updated text');

    cy.get('nav').contains('updated text');
  });

  it('can delete entries', () => {
    cy.server();
    cy.route({
      method: 'POST',
      url: '/api/workspace/graphql/',
      status: 201,
      response: {
        data: {
          entries: [
            {
              id: '123',
              text: 'Sample Post\nThis is the body',
              timeCreated: '2018-01-03T02:25:28+00:00',
              timeUpdated: null,
            },
          ],
        },
      },
    }).as('getEntries');

    cy.visit('/workspace/123');
    cy.wait('@getEntries');

    cy.route({
      method: 'POST',
      url: '/api/workspace/graphql/',
      status: 200,
      response: {
        data: {
          entry: {
            id: '123',
          },
        },
      },
    }).as('deleteEntry');

    cy.contains('delete').click();
    cy.contains('yup').click();
    cy.get('nav').contains('Sample Post').should('not.exist');
  });
});
