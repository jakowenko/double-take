import json

# Input JSON object
import sys


input_json = json.load(sys.stdin)

# TODO: Add your code here to process the input_json object


# Function to flatten a nested JSON object
def flatten_json(obj, parent_key=""):
    items = {}
    for key, value in obj.items():
        new_key = f"{parent_key}.{key}" if parent_key else key
        if isinstance(value, dict):
            items.update(flatten_json(value, new_key))
        else:
            items[new_key] = value
    return items


# Flatten the JSON object
flattened_json = flatten_json(input_json)

# Print the flattened JSON as lines
for key, value in flattened_json.items():
    print(f"{key}: {value}")
