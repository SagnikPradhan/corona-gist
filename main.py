import math
import os

import requests

username = os.environ.get("GH_USERNAME")
access_token = os.environ.get("GH_TOKEN")
gist_id = os.environ.get("GIST_ID")
# Valid the environment variables
if username is None or access_token is None or gist_id is None:
    raise ValueError("Please set the environment variables properly")


# Gets results from the api
def get_corona_results():
    request = requests.get("https://api.covid19api.com/summary")
    data = request.json()
    # We need only global data
    return data["Global"]


# Parses data into beauty
def parse_data(current_data):
    # Parse data for bar charts
    confirmed_cases = current_data["TotalConfirmed"]
    recovered_cases = current_data["TotalRecovered"]
    # Some math to calculate
    total_chars = 50
    ratio = recovered_cases / confirmed_cases
    confirmed_char_length = math.floor(total_chars / (ratio + 1))
    recovered_char_length = total_chars - confirmed_char_length
    string = "▓" * recovered_char_length + "░" * confirmed_char_length + \
             "\n\n▓ Recovered: {} ░  Confirmed: {}".format(recovered_cases, confirmed_cases)
    return string


# Publish gist to github
def publish_gist(content):
    # If everything is okay update gist
    endpoint = "https://api.github.com/gists/{}".format(gist_id)
    gist = {
        "description": "COVID-19 Updates",
        "files": {"status.md": {"content": content}},
    }
    request = requests.patch(endpoint, json=gist, auth=(username, access_token))
    if not request.ok:
        raise RuntimeError("Request Failed {}".format(request.status_code))
    else:
        print("Completed Work {}".format(request.status_code))


# Finally run it
publish_gist(parse_data(get_corona_results()))
