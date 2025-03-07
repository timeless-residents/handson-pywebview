import os
import webview
from api import RecipeManagerAPI


def main():
    # Get the directory of the current script
    base_dir = os.path.dirname(os.path.abspath(__file__))

    # Create API instance
    api = RecipeManagerAPI(base_dir)

    # Create window
    window = webview.create_window(
        "Recipe Manager",
        os.path.join(base_dir, "web", "index.html"),
        js_api=api,
        width=1000,
        height=800,
        min_size=(800, 600),
    )

    # Start the webview application
    webview.start(debug=True)


if __name__ == "__main__":
    main()
