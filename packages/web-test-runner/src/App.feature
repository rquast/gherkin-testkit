Feature: Confirming web test runner works with gherkin testkit

    Scenario: Incrementing the counter in the App component
        Given I have loaded the App component
        When I click the incremenet button
        Then I should see a count equal to 1