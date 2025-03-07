import os
import json
from datetime import datetime


class RecipeManagerAPI:
    def __init__(self, base_dir):
        self.base_dir = base_dir
        self.data_dir = os.path.join(base_dir, "data")

        # Ensure data directory exists
        if not os.path.exists(self.data_dir):
            os.makedirs(self.data_dir)

        # Paths to data files
        self.recipes_file = os.path.join(self.data_dir, "recipes.json")
        self.categories_file = os.path.join(self.data_dir, "categories.json")

        # Initialize data files if they don't exist
        self._initialize_data_files()

    def _initialize_data_files(self):
        """Initialize data files with default data if they don't exist"""
        # Initialize recipes file
        if not os.path.exists(self.recipes_file):
            default_recipes = [
                {
                    "id": 1,
                    "name": "Simple Pasta",
                    "description": "A quick and easy pasta dish",
                    "category": "Italian",
                    "ingredients": [
                        {"name": "Pasta", "amount": "200", "unit": "g"},
                        {"name": "Olive Oil", "amount": "2", "unit": "tbsp"},
                        {"name": "Garlic", "amount": "2", "unit": "cloves"},
                        {"name": "Salt", "amount": "1", "unit": "tsp"},
                        {"name": "Pepper", "amount": "1/2", "unit": "tsp"},
                    ],
                    "steps": [
                        "Boil water in a large pot",
                        "Add salt and pasta to the boiling water",
                        "Cook pasta according to package instructions",
                        "Drain pasta and return to pot",
                        "Add olive oil, minced garlic, salt, and pepper",
                        "Toss to combine and serve immediately",
                    ],
                    "prepTime": 5,
                    "cookTime": 10,
                    "servings": 2,
                    "createdAt": datetime.now().isoformat(),
                    "updatedAt": datetime.now().isoformat(),
                },
                {
                    "id": 2,
                    "name": "Classic Omelette",
                    "description": "A fluffy breakfast omelette",
                    "category": "Breakfast",
                    "ingredients": [
                        {"name": "Eggs", "amount": "3", "unit": ""},
                        {"name": "Butter", "amount": "1", "unit": "tbsp"},
                        {"name": "Salt", "amount": "1/4", "unit": "tsp"},
                        {"name": "Pepper", "amount": "1/4", "unit": "tsp"},
                        {"name": "Cheese", "amount": "30", "unit": "g"},
                    ],
                    "steps": [
                        "Crack eggs into a bowl and beat until smooth",
                        "Add salt and pepper to the eggs",
                        "Heat butter in a non-stick pan over medium heat",
                        "Pour in the egg mixture",
                        "When the eggs begin to set, sprinkle cheese on top",
                        "Fold the omelette in half and cook until the cheese melts",
                        "Serve hot",
                    ],
                    "prepTime": 3,
                    "cookTime": 5,
                    "servings": 1,
                    "createdAt": datetime.now().isoformat(),
                    "updatedAt": datetime.now().isoformat(),
                },
            ]
            self._save_data(self.recipes_file, default_recipes)

        # Initialize categories file
        if not os.path.exists(self.categories_file):
            default_categories = [
                {"id": 1, "name": "Italian"},
                {"id": 2, "name": "Breakfast"},
                {"id": 3, "name": "Japanese"},
                {"id": 4, "name": "Dessert"},
                {"id": 5, "name": "Vegetarian"},
                {"id": 6, "name": "Seafood"},
            ]
            self._save_data(self.categories_file, default_categories)

    def _load_data(self, file_path):
        """Load data from a JSON file"""
        try:
            if os.path.exists(file_path):
                with open(file_path, "r", encoding="utf-8") as file:
                    return json.load(file)
            return []
        except Exception as e:
            print(f"Error loading data from {file_path}: {str(e)}")
            return []

    def _save_data(self, file_path, data):
        """Save data to a JSON file"""
        try:
            with open(file_path, "w", encoding="utf-8") as file:
                json.dump(data, file, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"Error saving data to {file_path}: {str(e)}")
            return False

    def get_recipes(self):
        """Get all recipes"""
        return self._load_data(self.recipes_file)

    def get_recipe(self, recipe_id):
        """Get a specific recipe by ID"""
        recipes = self._load_data(self.recipes_file)
        for recipe in recipes:
            if recipe["id"] == recipe_id:
                return recipe
        return {"error": "Recipe not found"}

    def add_recipe(self, recipe_data):
        """Add a new recipe"""
        try:
            recipes = self._load_data(self.recipes_file)

            # Generate a new ID
            new_id = 1
            if recipes:
                new_id = max(recipe["id"] for recipe in recipes) + 1

            # Create new recipe
            new_recipe = {
                "id": new_id,
                "name": recipe_data.get("name", ""),
                "description": recipe_data.get("description", ""),
                "category": recipe_data.get("category", ""),
                "ingredients": recipe_data.get("ingredients", []),
                "steps": recipe_data.get("steps", []),
                "prepTime": recipe_data.get("prepTime", 0),
                "cookTime": recipe_data.get("cookTime", 0),
                "servings": recipe_data.get("servings", 1),
                "createdAt": datetime.now().isoformat(),
                "updatedAt": datetime.now().isoformat(),
            }

            recipes.append(new_recipe)

            if self._save_data(self.recipes_file, recipes):
                return {"success": True, "recipe": new_recipe}
            else:
                return {"error": "Failed to save recipe"}
        except Exception as e:
            return {"error": str(e)}

    def update_recipe(self, recipe_id, recipe_data):
        """Update an existing recipe"""
        try:
            recipes = self._load_data(self.recipes_file)

            for i, recipe in enumerate(recipes):
                if recipe["id"] == recipe_id:
                    # Update recipe fields
                    recipes[i]["name"] = recipe_data.get("name", recipe["name"])
                    recipes[i]["description"] = recipe_data.get(
                        "description", recipe["description"]
                    )
                    recipes[i]["category"] = recipe_data.get(
                        "category", recipe["category"]
                    )
                    recipes[i]["ingredients"] = recipe_data.get(
                        "ingredients", recipe["ingredients"]
                    )
                    recipes[i]["steps"] = recipe_data.get("steps", recipe["steps"])
                    recipes[i]["prepTime"] = recipe_data.get(
                        "prepTime", recipe["prepTime"]
                    )
                    recipes[i]["cookTime"] = recipe_data.get(
                        "cookTime", recipe["cookTime"]
                    )
                    recipes[i]["servings"] = recipe_data.get(
                        "servings", recipe["servings"]
                    )
                    recipes[i]["updatedAt"] = datetime.now().isoformat()

                    if self._save_data(self.recipes_file, recipes):
                        return {"success": True, "recipe": recipes[i]}
                    else:
                        return {"error": "Failed to save updated recipe"}

            return {"error": "Recipe not found"}
        except Exception as e:
            return {"error": str(e)}

    def delete_recipe(self, recipe_id):
        """Delete a recipe"""
        try:
            recipes = self._load_data(self.recipes_file)

            for i, recipe in enumerate(recipes):
                if recipe["id"] == recipe_id:
                    # Remove the recipe
                    deleted_recipe = recipes.pop(i)

                    if self._save_data(self.recipes_file, recipes):
                        return {"success": True, "recipe": deleted_recipe}
                    else:
                        return {"error": "Failed to save after deletion"}

            return {"error": "Recipe not found"}
        except Exception as e:
            return {"error": str(e)}

    def get_categories(self):
        """Get all categories"""
        return self._load_data(self.categories_file)

    def add_category(self, category_name):
        """Add a new category"""
        try:
            categories = self._load_data(self.categories_file)

            # Check if category already exists
            for category in categories:
                if category["name"].lower() == category_name.lower():
                    return {"error": "Category already exists"}

            # Generate a new ID
            new_id = 1
            if categories:
                new_id = max(category["id"] for category in categories) + 1

            # Create new category
            new_category = {"id": new_id, "name": category_name}

            categories.append(new_category)

            if self._save_data(self.categories_file, categories):
                return {"success": True, "category": new_category}
            else:
                return {"error": "Failed to save category"}
        except Exception as e:
            return {"error": str(e)}

    def delete_category(self, category_id):
        """Delete a category"""
        try:
            categories = self._load_data(self.categories_file)

            for i, category in enumerate(categories):
                if category["id"] == category_id:
                    # Remove the category
                    deleted_category = categories.pop(i)

                    if self._save_data(self.categories_file, categories):
                        return {"success": True, "category": deleted_category}
                    else:
                        return {"error": "Failed to save after deletion"}

            return {"error": "Category not found"}
        except Exception as e:
            return {"error": str(e)}

    def search_recipes(self, query, category=None):
        """Search recipes by name, description, or ingredients"""
        try:
            recipes = self._load_data(self.recipes_file)
            results = []

            query = query.lower()

            for recipe in recipes:
                # Filter by category if specified
                if category and recipe["category"] != category:
                    continue

                # Search in name and description
                if (
                    query in recipe["name"].lower()
                    or query in recipe["description"].lower()
                ):
                    results.append(recipe)
                    continue

                # Search in ingredients
                for ingredient in recipe["ingredients"]:
                    if query in ingredient["name"].lower():
                        results.append(recipe)
                        break

            return results
        except Exception as e:
            return {"error": str(e)}

    def calculate_total_time(self, recipe_id):
        """Calculate total cooking time for a recipe"""
        recipe = self.get_recipe(recipe_id)

        if "error" in recipe:
            return recipe

        prep_time = recipe.get("prepTime", 0)
        cook_time = recipe.get("cookTime", 0)

        return {
            "prepTime": prep_time,
            "cookTime": cook_time,
            "totalTime": prep_time + cook_time,
        }
