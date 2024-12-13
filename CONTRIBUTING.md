# Contribution Guide

Welcome to the Squad 44 Community Bot repository! We appreciate your interest in contributing to our project. To ensure a smooth and efficient contribution process, please follow the guidelines outlined below.

## Table of Contents

1. [Getting Started](#getting-started)
2. [How to Contribute](#how-to-contribute)
<!-- 3. [Code of Conduct](#code-of-conduct) -->
<!-- 4. [Style Guide](#style-guide) -->
3. [Submitting Your Changes](#submitting-your-changes)
4. [Additional Resources](#additional-resources)

## Getting Started

1. **Fork the Repository**: To contribute, start by [forking the repository](https://github.com/Maximus7474/Squad44Bot/fork) to your GitHub account.
2. **Clone Your Fork**: Clone the forked repository to your local machine using:
   ```bash
   git clone https://github.com/Maximus7474/Squad44Bot.git
   ```
3. **Set Up the Project**: Follow the setup instructions in the [README](./README.md) to install dependencies and configure the project.

#### Specifics:
- If you're contributing to the vehicle deck file, please ensure to work of the [TankDecks](https://github.com/Maximus7474/Squad44Bot/tree/TankDecks) branch, as it will be the most up to date version.

## How to Contribute

1. **Identify an Issue**: Check the [Issues](https://github.com/Maximus7474/Squad44Bot/issues) tab to find bugs, enhancements, or features to work on. You can also open a new issue to propose your own idea.
2. **Create a New Branch**: Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make Your Changes**: Implement your changes. Ensure you write clear and concise commit messages.
4. **Test Your Changes**: Run tests to verify that your changes work as expected and do not break existing functionality.
5. **Commit Your Changes**: Commit your changes with a descriptive message, following [git conventions](https://gist.github.com/qoomon/5dfcdf8eec66a051ecd85625518cfd13):
   ```bash
   git add .
   git commit -m "Add a descriptive message about your changes"
   ```
6. **Push to Your Fork**: Push your changes to your forked repository:
   ```bash
   git push origin feature/your-feature-name
   ```

## Updating `vehicleInfo.json`
When updating the `vehicleInfo.json` file, please follow the established template structure for different categories of vehicles: **Tanks**, **Vehicles**, and **Canons**.

### Tanks Template
Each tank entry should be structured as follows:

```json
"Tank Name": {
   "team": "Axis" or "Allies",
   "type": "Light/Recon/Medium/Heavy Tank",
   "factions": ["1st Airborne", "Polish Brigade", "Wehrmacht", "9.SS Panzer", "etc..."],
   "chapters": ["I", "II", "III", "IV", "Mercury"],
   "image": "url to an image", // or null
   "details": {
      "crew": [
         "Driver", "Gunner", "Hull-Gunner", "Commander"
      ],
      "passengers": 7, // optional
      "caliber": "50mm",
      "shells": {
         "APC-HE-T": "X",
         "APCR-T": "X"
      }
   }
}
```

### Vehicles Template
Each vehicle entry should be structured as follows:

```js
"Name": {
   "team": "Allies" || "Axis",
   "class": "Specialized" || "Mechanized",
   "type": "Specialized Vehicle" || null, // Optional value
   "factions": ["1st Airborne", "Polish Brigade", "Wehrmacht", "9.SS Panzer", "etc..."],
   "chapters": ["I", "II", "III", "IV", "Mercury"],
   "seats": 5, // Required value
   "weaponry": {
      "Vickers MG": 1
   } // or set the value to null if no weapons or it's not applicable
}
```

### Canons Template
Each canon entry should be structured as follows:

```json
"QF. 6 Pounder": {
    "team": "Allies" || "Axis",
    "type": "Anti-Tank Canon", // or "Anti-Infantry Gun", "etc..."
   "factions": ["1st Airborne", "Polish Brigade", "Wehrmacht", "9.SS Panzer", "etc..."],
    "chapters": ["I", "II", "III", "IV", "Mercury"],
    "weaponry": {
        "Canon Calibre": 1 // any value, not used for the moment
    }
}
```

Ensure that all fields are accurately filled out according to the vehicle's characteristics. If a field is optional and not applicable, you may omit it or set it to `null` as indicated.

## Submitting Your Changes

1. **Create a Pull Request**: Navigate to the [Pull Requests](https://github.com/Maximus7474/Squad44Bot/pulls) tab in the main repository and click on "New Pull Request." Select your branch and submit the pull request with a descriptive title and comments.
2. **Review and Feedback**: Your pull request will be reviewed by the project maintainers. Be prepared to make adjustments based on feedback.

## Style Guide
- **Code Formatting**: Ensure your code is consistently formatted, adhere to the project's existing style.
- **Comments**: Comment your code where necessary, especially complex logic.
- **Naming Conventions**: Use clear and descriptive names for variables, functions, and classes.

## Testing
Before submitting your pull request, ensure that your code passes all existing tests. If you've added new functionality, please write corresponding tests.



## Pull Requests
When submitting a pull request, please ensure the following:
- All tests pass successfully.
- Your pull request includes relevant documentation updates.

## Additional Resources

<!-- - **Documentation**: Refer to the [Documentation](./docs/) for detailed information about the project. -->
- **Community**: Join our [Discussion Forum](https://github.com/Maximus7474/Squad44Bot/discussions) or our [Discord Server](https://discord.gg/6mgjuBnmHC) for community support and conversations.

Thank you for contributing to Squad 44 Community Bot! We look forward to your contributions.