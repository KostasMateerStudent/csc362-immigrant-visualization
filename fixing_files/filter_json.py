import json

# Read in the filtered data
with open('filtered_continents.json', 'r') as f:
    filtered_data = json.load(f)

# List of countries to filter
countries_to_filter = ['China', 'United States', 'Mexico', 'Canada']

# Extract a list of countries from the filtered data
filtered_countries = [item['country'] for item in filtered_data]

# Check for any missed countries
missed_countries = set(countries_to_filter) - set(filtered_countries)

# Print any missed countries
if missed_countries:
    print('The following countries were missed:')
    for country in missed_countries:
        print(country)
else:
    print('All countries were successfully filtered.')
