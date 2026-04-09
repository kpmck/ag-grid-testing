describe("agGridWaitForAnimation", () => {
  it("waits for AG Grid-owned animations to finish", () => {
    cy.visit("../app/animation-wait/ag-owned.html");
    cy.get(".ag-cell", { timeout: 10000 }).should("be.visible");

    cy.window().then((win) => {
      win.startAnimationWaitScenario();
      win.__animationProbe.waitStartedAt = Date.now();
    });

    cy.get("#myGrid")
      .agGridWaitForAnimation()
      .then(() => {
        cy.window().then((win) => {
          const elapsedMs = Date.now() - win.__animationProbe.waitStartedAt;
          expect(win.__animationProbe.agStarted).to.equal(true);
          expect(win.__animationProbe.agFinished).to.equal(true);
          expect(elapsedMs).to.be.greaterThan(200);
          expect(elapsedMs).to.be.lessThan(2000);
        });
      });
  });

  it("ignores third-party subtree animations whose finished promise never resolves", () => {
    cy.visit("../app/animation-wait/third-party-subtree.html");
    cy.get(".ag-cell", { timeout: 10000 }).should("be.visible");

    cy.window().then((win) => {
      win.startAnimationWaitScenario();
      win.__animationProbe.waitStartedAt = Date.now();
    });

    cy.get("#myGrid .os-scrollbar-handle").should("exist");

    cy.get("#myGrid")
      .agGridWaitForAnimation()
      .then(() => {
        cy.window().then((win) => {
          const elapsedMs = Date.now() - win.__animationProbe.waitStartedAt;
          expect(win.__animationProbe.agFinished).to.equal(true);
          expect(win.__animationProbe.thirdPartyInstalled).to.equal(true);
          expect(elapsedMs).to.be.lessThan(2000);
        });
      });
  });
});
