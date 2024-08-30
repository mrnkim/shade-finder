describe("The home page", () => {
  beforeEach(() => {
    cy.visit("http://192.168.45.102:5500/frontend/public/"); // to be updated
    cy.get("#carousel-image")
      .should("have.attr", "src")
      .and("include", "./images/berry.jpg");
    cy.get("#color-label").should("have.text", "Berry Shades");
  });

  it("successfully loads the title", () => {
    cy.contains("Shade Finder");
  });

  it("should navigate to the next image when the next button is clicked", () => {
    cy.get("#next").click();

    cy.get("#carousel-image")
      .should("have.attr", "src")
      .and("include", "./images/orange.png");

    cy.get("#color-label").should("have.text", "Orange Shades");
  });

  it("should navigate to the previous image when the prev button is clicked", () => {
    cy.get("#prev").click();

    cy.get("#carousel-image")
      .should("have.attr", "src")
      .and("include", "./images/brown.png");

    cy.get("#color-label").should("have.text", "Brown Shades");
  });
});
