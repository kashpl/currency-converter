# Currency Converter

A modern and responsive currency converter built with HTML, CSS, and JavaScript.

This project was developed with the goal of creating a practical and user-friendly tool for real-time currency conversion. It focuses not only on functionality, but also on interface clarity, responsiveness, and a smooth user experience.

## Live Demo

https://kashpl.github.io/currency-converter/

## Preview

![Currency Converter Preview](./preview.png)

## Features

- Real-time currency conversion using external exchange rate API
- Dark mode with persistent user preference
- One-click currency swap
- Bitcoin (BTC) conversion support with adjusted logic
- Conversion history stored with localStorage
- Automatic data refresh every 60 seconds
- Responsive and user-friendly interface

## Why I Built This

The idea behind this project was to build something that feels useful in a real-world scenario.

Instead of creating a basic converter, the goal was to improve usability and add features that make the tool more practical, such as history tracking, theme persistence, and automatic updates.

This project also helped reinforce concepts related to working with APIs and managing state in the browser.

## Tech Stack

- HTML5  
- CSS3 (custom styling, no frameworks)  
- Vanilla JavaScript  
- External API for exchange rates (AwesomeAPI)  

## How It Works

The application fetches real-time exchange rates from an external API and applies them to user input values.

It allows users to:
- select currencies
- input an amount
- instantly convert values based on the latest available rates

Additional logic is applied for specific cases such as BTC conversion and maintaining a local history of recent conversions.

## Project Structure

```bash
currency-converter/
├── index.html
├── style.css
├── script.js
├── preview.png
└── README.md
