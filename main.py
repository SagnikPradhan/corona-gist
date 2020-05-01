import requests
import os


def get_corona_results():
    request = requests.get("https://api.covid19api.com/summary")
    data = request.json()
    return data


def parse_data(data):
    # Parse data for markdown
    impData = data["Global"]
    template = 'COVID19-Update-🦠:\n  Recovered: {}\n  Confirmed-Cases: {}\n  Message: "Stay the fuck at home 🏠"'
    return template.format(impData["TotalConfirmed"], impData["TotalRecovered"])


def publish_gist(data):
    username = os.environ.get("GH_USERNAME")
    access_token = os.environ.get("GH_TOKEN")
    gist_id = os.environ.get("GIST_ID")
    # Valid the environment variables
    if username is None or access_token is None or gist_id is None:
        raise ValueError("Please set the environment variables properly")
    else:
        endpoint = "https://api.github.com/gists/{}".format(gist_id)
        data = {
            "description": "Covid19 Updates",
            "files": {"index.yml": {"content": parse_data(data)}},
        }
        request = requests.patch(endpoint, json=data, auth=(username, access_token))
        if not request.ok:
            raise RuntimeError("Request Failed {}".format(request.status_code))
        else:
            print("Completed Work {}".format(request.status_code))


# Start work
data = get_corona_results()
publish_gist(data)
