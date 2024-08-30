describe("Search", () => {
  before(() => {
    cy.visit("http://192.168.45.102:5500/frontend/public/");

    cy.get("#carousel-image")
      .should("have.attr", "src")
      .and("include", "./images/berry.jpg");
    cy.get("#color-label").should("have.text", "Berry Shades");
  });

  it("shows the search results and checks for confidence span", () => {
    cy.get("#search").click();

    cy.wait(5000);

    cy.get("#search-result-list")
      .find("span")
      .should("have.class", "bg-teal-400");

    cy.get("#search-result-list")
      .find("span")
      .should(($span) => {
        expect($span).to.have.length.greaterThan(0);
        expect($span.text()).to.match(/medium|high|low/i);
      });

  /** Test with Show More Button */
    cy.get("#show-more-button").should("exist");

    cy.get("#show-more-button").click();

    cy.wait(5000);

    cy.get("#search-result-list")
      .children()
      .should(($children) => {
        const initialCount = $children.length;
        expect(initialCount).to.be.greaterThan(0);
      });
  });
});
