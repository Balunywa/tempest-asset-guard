# Azure Asset Guardian

Build a production-quality Oil & Gas Weather & Asset Risk Operations Accelerator on top of Microsoft Azure.

This is not a generic weather dashboard and it is not a replacement for Microsoft Planetary Computer Pro.

The application is the industry solution layer customers interact with. Planetary Computer Pro and other Azure services provide the geospatial, weather, AI, identity, storage, monitoring, and data foundation underneath.

The goal is to give an oil & gas customer a polished application they could deploy into their own Azure subscription, connect to their infrastructure data, and immediately use to understand how weather events may affect offshore platforms, pipelines, refineries, LNG terminals, wells, and other critical assets.

Primary Use Case

Start with:

Gulf of Mexico Hurricane & Asset Impact Intelligence

An operator should be able to open the application and immediately understand:

What weather events are developing?

Which company assets are exposed?

When will those assets be affected?

What is the severity?

What infrastructure lies inside the forecast cone or impact area?

What should operations teams pay attention to over the next 24, 48, and 72 hours?

The experience should feel like a serious enterprise operational product used by ExxonMobil, Chevron, Shell, BP, SLB, Halliburton, or another major energy company — not a hackathon demo.

Core Experience

The main dashboard should have a large interactive operational map as the centerpiece.

Show:

Offshore platforms

Pipelines

Wells

Refineries

LNG terminals

Storage facilities

Ports

Customer-defined critical infrastructure

Hurricane tracks

Forecast cones

Severe wind areas

Rainfall

Flood exposure

Storm impact areas

Weather layers

Satellite/geospatial layers

Assets should have different visual states based on risk:

Normal

Monitor

Elevated

High

Critical

Clicking an asset should open a detailed side panel showing:

Asset name

Asset type

Location

Operating status

Current weather

Forecast conditions

Expected time of impact

Wind speed

Rainfall

Storm proximity

Risk score

Risk explanation

Nearby exposed infrastructure

Recommended operational considerations

Executive Summary

At the top of the dashboard show operational metrics such as:

Hurricane Gabrielle — 72 Hour Outlook

186 Assets Monitored

17 Assets Exposed

6 Inside Forecast Cone

3 High Risk

2 Critical

First Expected Impact: 31 Hours

Include a concise AI-generated operational summary such as:

“Gabrielle is forecast to enter the central Gulf within 48 hours. Six offshore facilities are currently inside the projected impact corridor. Platform Delta-7 has the highest exposure based on forecast wind intensity and storm proximity.”

Application Navigation

Create these primary sections:

Operations Overview

Executive dashboard showing:

active weather events

asset exposure

operational risk

map

alerts

upcoming impact timeline

Live Map

Full-screen geospatial operations view.

Allow users to toggle layers for:

customer assets

storms

wind

rainfall

flood risk

satellite imagery

forecast models

historical events

Include search and filtering by:

geography

asset type

business unit

severity

operator

risk level

Weather Events

Show active storms and severe-weather events.

Each event should include:

current location

trajectory

speed

intensity

forecast cone

expected landfall

forecast timeline

affected assets

confidence level

latest model update

Asset Risk

Provide a ranked list of infrastructure based on exposure.

Example table:

Asset | Type | Region | Risk | Impact ETA | Primary Threat

Allow filtering and sorting.

Clicking an asset should synchronize the table with the map.

Forecast Timeline

Create a visual 24 / 48 / 72 / 120-hour operational forecast.

Show how risk changes over time.

The user should be able to scrub through time and see storm movement and corresponding asset exposure on the map.

Alerts

Create an operational alert center.

Examples:

Platform Delta-7 entered high-risk storm corridor.

Pipeline Segment GOM-12 forecast to experience severe rainfall within 18 hours.

Wind forecast for Facility Bravo exceeded configured threshold.

Hurricane track updated at 14:00 UTC.

Allow severity, acknowledgement, status, owner, and timestamp.

AI Operations Assistant

Create a prominent AI assistant integrated with the operational context.

Example questions:

Which offshore platforms are most at risk over the next 72 hours?

When is Platform Delta-7 expected to experience hurricane-force winds?

Show pipelines inside the current storm-impact corridor.

What changed between the latest forecast and the previous forecast?

Which assets should operations teams review first?

Summarize Gulf of Mexico risk for leadership.

Show the assets within 100 miles of the hurricane track.

Responses should be grounded in the current map, assets, weather forecasts, and risk calculations.

When relevant, AI answers should update or highlight objects on the map.

Customer Data

Create an Asset Management section allowing customers to connect or import their own infrastructure.

Support conceptual integrations for:

CSV

GeoJSON

Shapefile

ArcGIS

Azure Storage

Microsoft Fabric

REST APIs

Asset schema should support:

ID

name

type

latitude

longitude

geometry

operator

region

business unit

operating status

criticality

metadata

Azure Architecture

Design the application assuming the following Azure foundation.

Planetary Computer Pro

Use Planetary Computer Pro for:

GeoCatalog

STAC

geospatial datasets

imagery

catalog search

tiles

ingestion

secure data access

Do not rebuild Planetary Computer Pro functionality.

Build APIs/adapters that allow the application to consume Planetary Computer Pro services.

Azure Maps

Use Azure Maps for the interactive operational map and geospatial visualization.

Azure AI Foundry

Use Azure AI Foundry for:

Operations Copilot

natural-language queries

summaries

explanations

agent workflows

Weather Models

Architect the system so forecast data can come from:

Microsoft Aurora

ECMWF

other weather providers/models

Weather-provider implementations should be modular.

Azure Storage

Use Azure Blob Storage for supporting datasets, artifacts, model results, and customer data where appropriate.

Authentication

Use Microsoft Entra ID.

The UI should assume enterprise authentication and RBAC.

Create roles such as:

Viewer

Operator

Analyst

Administrator

Security

Design for enterprise deployment with:

Entra ID

Managed Identity

Key Vault

Private Endpoints

VNet integration

no secrets stored in source code

environment-based configuration

Observability

Assume:

Azure Monitor

Application Insights

Log Analytics

Backend Architecture

Create a clean API layer instead of tightly coupling the UI directly to individual Azure services.

Use adapters/services similar to:

/api/assets

/api/weather

/api/events

/api/risk

/api/geospatial

/api/alerts

/api/copilot

Create service interfaces such as:

PlanetaryComputerService

WeatherService

AssetService

RiskEngine

AlertService

CopilotService

This architecture should allow mocked/sample implementations to be replaced with real Azure integrations later without rewriting the UI.

Risk Engine

Create an initial transparent risk-scoring model.

Risk should consider factors such as:

distance from predicted storm path

forecast wind speed

rainfall

storm intensity

expected time to impact

asset criticality

asset type

Display why an asset received its risk score.

Do not create a mysterious black-box score.

Example:

Risk: HIGH — 82/100

Reasons:

34 miles from predicted storm centerline

91 mph forecast wind

impact expected in 29 hours

asset designated business-critical

Sample Data

Include realistic synthetic Gulf of Mexico oil & gas data so the application looks complete immediately after deployment.

Create sample:

offshore platforms

pipeline routes

LNG terminals

refineries

wells

ports

active hurricane

forecast trajectory

forecast cone

wind fields

asset exposure calculations

alerts

Clearly isolate sample data from production integrations.

Do not hard-code the application around the sample dataset.

UX Requirements

The design should feel like an enterprise operations command center.

Think:

Microsoft Azure + Palantir + modern GIS operations platform.

Use a clean, sophisticated visual hierarchy.

Prioritize the map and operational information over marketing graphics.

Avoid excessive gradients, giant marketing cards, animations, or startup-style fluff.

This should feel like software an engineer, operations manager, geoscientist, or emergency-response team would actually leave open on a second monitor all day.

Use:

dense but readable information

excellent typography

subtle status indicators

professional charts

responsive layout

strong map interaction

dark and light modes

Desktop should be the primary experience, but make it responsive.

Deployment Experience

Architect the project so the eventual customer experience can be:

Deploy to Azure → Select Subscription → Configure Components → Deploy

Configuration options should include:

Azure region

Planetary Computer Pro

weather forecasting

AI Copilot

sample O&G dataset

private networking

customer asset ingestion

monitoring

Keep infrastructure configuration separate from application code so Bicep/Terraform/GitHub Actions deployment automation can be added or extended.

Extensibility

Although v1 focuses on Gulf of Mexico hurricane operations, build the application framework so additional solution packs can later be added:

Pipeline Flood Risk

Wildfire & Right-of-Way Monitoring

Refinery Weather Risk

LNG Terminal Operations

Methane Monitoring

Environmental Monitoring

Remote Asset Intelligence

Earth Observation

Exploration Geospatial Intelligence

These solution packs should reuse the same core platform, identity, maps, asset model, data connectors, AI layer, and UI shell.

Important Product Principle

Do not expose Azure complexity to the end user.

The oil & gas operator should not need to understand STAC catalogs, Azure resources, model endpoints, storage accounts, or infrastructure configuration.

Translate the Azure technology into operational outcomes.

Do not show:

“STAC Collection 19 selected.”

Prefer:

“Satellite imagery — Gulf of Mexico.”

Do not show:

“Aurora inference completed.”

Prefer:

“72-hour forecast updated 4 minutes ago.”

Do not show:

“Spatial intersection generated.”

Prefer:

“6 offshore facilities are inside the projected impact corridor.”

Final Goal

When someone sees this application, the reaction should be:

“This is a finished Oil & Gas weather operations product that happens to be powered by Azure.”

Not:

“This is a demo showing several Azure services.”

Build the initial application end-to-end with production-quality frontend structure, reusable components, realistic synthetic data, clean API/service abstractions, map interactions, dashboards, asset risk views, weather-event workflows, alerts, and the AI assistant experience.

Where live Azure credentials or services are not available, implement a clean mock provider behind the same interface the real Azure provider will eventually use. Do not block the user experience because an external service has not yet been configured.

Yes. People already sell this problem, and that actually validates your accelerator.

After looking specifically at offshore/oil & gas weather operations, I'd rank the products you should benchmark like this:

ProductWhy it mattersWhat I'd stealStormGeoBest direct O&G/offshore benchmarkOperational workflows, asset overview, weather windowsDTN WeatherOpsExtremely close to your exact conceptAssets + map + thresholds + tropical alertsTomorrow.ioBest modern product/UX benchmarkAI, timelines, automated protocols, polished UX

1. StormGeo — probably your closest O&G competitor

If you're asking "who already has the best mature offshore-energy version of this?" I'd start with StormGeo.

StormGeo says it supports 2,500+ offshore sites worldwide. Its offshore product already provides site-specific warnings, forecasts, configurable asset overviews, long-range weather windows and 24/7 meteorologist support. Shell E&P is also shown as a customer reference on its offshore product page. (StormGeo)

The important feature for your thinking is Asset Overview:

all the operations/assets in one view, with weather windows individually configured for each customer/project. (StormGeo)

That's essentially the business problem you're describing.

StormGeo is saying:

Weather → asset → operational decision

rather than simply:

Weather → pretty map.

That's exactly the distinction your accelerator needs.

2. DTN WeatherOps — this is almost your requirements document

DTN is probably the competitor I'd study feature-for-feature.

WeatherOps specifically targets marine/offshore operations. It lets operators manage:

assets → users → thresholds → alerts → maps → forecasts → archived reports.

It has a web portal, mobile app, interactive situation-room map, executive threat matrix and asset-specific severe-weather advisories. It also provides tropical disturbance alerts up to ten days ahead. (DTN)

DTN even has material specifically describing managing weather risk for a global drilling rig fleet. (DTN)

So when we wrote things like:

186 assets monitored
17 exposed
6 high risk
impact ETA
threshold alerts

we weren't inventing an imaginary market.

Companies already buy this capability.

3. Tomorrow.io — this is the one whose UX I'd study hardest

Tomorrow.io is less specifically "oil & gas product" than StormGeo/DTN, but technologically its current product is probably closest to the modern experience you're imagining.

Their platform now has:

interactive asset maps

automated operational protocols

weather-impact rules

event timelines

probabilistic forecasts

alerts

mobile

AI recommendations

a GenAI assistant called Gale

questions like "summarize my top impacted locations." (Tomorrow.io)

And Tomorrow.io explicitly describes an offshore rig scenario where the system identifies which operational assets are at risk from weather, rather than merely displaying a forecast. (Tomorrow.io)

That's very close to:

"Which Gulf platforms are at risk in the next 72 hours?"

So I'd borrow heavily from Tomorrow.io's interaction model.

But here's the interesting part for your Microsoft accelerator

I wouldn't try to beat StormGeo at being StormGeo.

They've got meteorologists, forecasting services, decades of domain knowledge, and thousands of offshore sites. (StormGeo)

Your play is different.

StormGeo / DTN

Their weather platform
      +
Their models
      +
Their data
      +
Their application
      ↓
Customer subscribes

What you're proposing

            CUSTOMER'S AZURE

       Oil & Gas Operations App
                 │
        Asset Impact Engine
        AI / Agents / Alerts
                 │
      ┌──────────┴──────────┐
      │                     │
Planetary Computer      AI Foundry
Pro / GeoCatalog        + Aurora
      │                     │
      └──────────┬──────────┘
                 │
        Customer O&G Data
      Wells / Pipelines /
    Platforms / Refineries
                 │
          Azure Foundation
 Entra / Storage / Maps / KV /
 Network / Monitor / Fabric

That's fundamentally more interesting for an Azure accelerator.

You're effectively saying:

What if an O&G customer could deploy something resembling the operational capabilities of WeatherOps/StormGeo/Tomorrow.io, but built on Azure services, integrated with their own geospatial and asset estate, and extensible by them?

I couldn't find a public offering from these competitors positioned exactly as "deploy the entire solution accelerator into your own Azure subscription and extend the code yourself." Their public positioning is much more around consuming their weather-intelligence platforms and services. That's an important potential differentiation, although we'd need to validate it commercially rather than assume every customer wants to own the stack. (StormGeo)

So I'd change your Lovable target slightly

Don't tell Lovable:

"Build me an oil & gas weather dashboard."

Tell it:

Use Tomorrow.io as the UX quality benchmark, DTN WeatherOps as the operational workflow benchmark, and StormGeo as the offshore-industry capability benchmark. Build an Azure-native O&G operations experience around Planetary Computer Pro and Aurora without copying their branding or proprietary UI.

That's a much better target.

And there's actually a very nice gap between them:

StormGeo: strongest domain/offshore operations
DTN: strongest direct asset/weather workflow match
Tomorrow.io: strongest modern software/AI experience
Microsoft PG + your accelerator: potentially strongest customer-owned Azure geospatial + AI + O&G extensibility story

That last one is what I'd build around.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/48584dc6-2cd5-4a5d-b6eb-e5d7639d17a0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
