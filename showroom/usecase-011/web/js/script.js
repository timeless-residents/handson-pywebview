// Global variables
let currentRecipes = [];
let currentCategories = [];
let selectedRecipeId = null;

// DOM elements - Main UI
const recipeList = document.getElementById("recipe-list");
const categoryFilter = document.getElementById("category-filter");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const addRecipeBtn = document.getElementById("add-recipe-btn");
const newCategoryInput = document.getElementById("new-category-input");
const addCategoryBtn = document.getElementById("add-category-btn");
const categoryList = document.getElementById("category-list");

// DOM elements - Recipe View
const noRecipeMessage = document.getElementById("no-recipe-message");
const recipeView = document.getElementById("recipe-view");
const recipeTitle = document.getElementById("recipe-title");
const recipeCategory = document.getElementById("recipe-category");
const prepTime = document.getElementById("prep-time");
const cookTime = document.getElementById("cook-time");
const totalTime = document.getElementById("total-time");
const servings = document.getElementById("servings");
const recipeDescription = document.getElementById("recipe-description");
const ingredientsList = document.getElementById("ingredients-list");
const stepsList = document.getElementById("steps-list");
const editRecipeBtn = document.getElementById("edit-recipe-btn");
const deleteRecipeBtn = document.getElementById("delete-recipe-btn");

// DOM elements - Recipe Form
const recipeForm = document.getElementById("recipe-form");
const formTitle = document.getElementById("form-title");
const recipeEditForm = document.getElementById("recipe-edit-form");
const recipeIdInput = document.getElementById("recipe-id");
const formName = document.getElementById("form-name");
const formDescription = document.getElementById("form-description");
const formCategory = document.getElementById("form-category");
const formServings = document.getElementById("form-servings");
const formPrepTime = document.getElementById("form-prep-time");
const formCookTime = document.getElementById("form-cook-time");
const ingredientsContainer = document.getElementById("ingredients-container");
const stepsContainer = document.getElementById("steps-container");
const addIngredientBtn = document.getElementById("add-ingredient-btn");
const addStepBtn = document.getElementById("add-step-btn");
const cancelBtn = document.getElementById("cancel-btn");
const saveRecipeBtn = document.getElementById("save-recipe-btn");

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOM content loaded, initializing application");

  // Set up event listeners
  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });
  categoryFilter.addEventListener("change", handleSearch);
  addRecipeBtn.addEventListener("click", showAddRecipeForm);
  addCategoryBtn.addEventListener("click", handleAddCategory);
  newCategoryInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleAddCategory();
  });
  editRecipeBtn.addEventListener("click", handleEditRecipe);
  deleteRecipeBtn.addEventListener("click", handleDeleteRecipe);
  addIngredientBtn.addEventListener("click", addIngredientRow);
  addStepBtn.addEventListener("click", addStepRow);
  cancelBtn.addEventListener("click", hideRecipeForm);
  recipeEditForm.addEventListener("submit", handleSaveRecipe);

  try {
    // Load initial data
    await Promise.all([loadCategories(), loadRecipes()]);

    // If there are recipes, select the first one
    if (currentRecipes.length > 0) {
      selectRecipe(currentRecipes[0].id);
    }
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});

// Load recipes from the server
async function loadRecipes() {
  try {
    const recipes = await window.pywebview.api.get_recipes();
    console.log("Loaded recipes:", recipes);

    if (recipes && recipes.length > 0) {
      currentRecipes = recipes;
      renderRecipeList();
      return recipes;
    } else {
      // If no recipes returned, try to trigger a search to load default recipes
      console.log("No recipes found, triggering search to load defaults");
      await handleSearch();
      return currentRecipes;
    }
  } catch (error) {
    console.error("Error loading recipes:", error);
    return [];
  }
}

// Load categories from the server
async function loadCategories() {
  try {
    const categories = await window.pywebview.api.get_categories();
    console.log("Loaded categories:", categories);
    currentCategories = categories;
    renderCategoryList();
    populateCategoryDropdowns();
    return categories;
  } catch (error) {
    console.error("Error loading categories:", error);
    return [];
  }
}

// Render the recipe list
function renderRecipeList() {
  recipeList.innerHTML = "";

  if (currentRecipes.length === 0) {
    const noRecipesMsg = document.createElement("div");
    noRecipesMsg.className = "no-recipes-message";
    noRecipesMsg.textContent =
      "レシピがありません。新しいレシピを追加してください。";
    recipeList.appendChild(noRecipesMsg);
    return;
  }

  currentRecipes.forEach((recipe) => {
    const recipeItem = document.createElement("div");
    recipeItem.className = "recipe-item";
    if (selectedRecipeId === recipe.id) {
      recipeItem.classList.add("active");
    }
    recipeItem.dataset.id = recipe.id;

    const title = document.createElement("div");
    title.className = "recipe-item-title";
    title.textContent = recipe.name;

    const category = document.createElement("div");
    category.className = "recipe-item-category";
    category.textContent = recipe.category;

    const time = document.createElement("div");
    time.className = "recipe-item-time";
    time.textContent = `準備: ${recipe.prepTime}分 / 調理: ${recipe.cookTime}分`;

    recipeItem.appendChild(title);
    recipeItem.appendChild(category);
    recipeItem.appendChild(time);

    recipeItem.addEventListener("click", () => selectRecipe(recipe.id));
    recipeList.appendChild(recipeItem);
  });
}

// Render the category list
function renderCategoryList() {
  categoryList.innerHTML = "";
  categoryFilter.innerHTML = '<option value="">すべてのカテゴリ</option>';

  currentCategories.forEach((category) => {
    // Add to category list in sidebar
    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";

    const categoryName = document.createElement("span");
    categoryName.textContent = category.name;

    const deleteBtn = document.createElement("span");
    deleteBtn.className = "category-delete";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () =>
      handleDeleteCategory(category.id)
    );

    categoryItem.appendChild(categoryName);
    categoryItem.appendChild(deleteBtn);
    categoryList.appendChild(categoryItem);

    // Add to category filter dropdown
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = category.name;
    categoryFilter.appendChild(option);
  });
}

// Populate category dropdowns in the form
function populateCategoryDropdowns() {
  formCategory.innerHTML = "";

  currentCategories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = category.name;
    formCategory.appendChild(option);
  });
}

// Select and display a recipe
async function selectRecipe(recipeId) {
  selectedRecipeId = recipeId;

  // Update UI to show selected recipe
  const recipeItems = document.querySelectorAll(".recipe-item");
  recipeItems.forEach((item) => {
    if (parseInt(item.dataset.id) === recipeId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });

  // Get recipe details
  const recipe = currentRecipes.find((r) => r.id === recipeId);
  if (!recipe) return;

  // Calculate total time
  const timeData = await window.pywebview.api.calculate_total_time(recipeId);

  // Update recipe view
  recipeTitle.textContent = recipe.name;
  recipeCategory.textContent = recipe.category;
  prepTime.textContent = recipe.prepTime;
  cookTime.textContent = recipe.cookTime;
  totalTime.textContent = timeData.totalTime;
  servings.textContent = recipe.servings;
  recipeDescription.textContent = recipe.description;

  // Render ingredients
  ingredientsList.innerHTML = "";
  recipe.ingredients.forEach((ingredient) => {
    const li = document.createElement("li");
    li.textContent = `${ingredient.name}: ${ingredient.amount} ${ingredient.unit}`;
    ingredientsList.appendChild(li);
  });

  // Render steps
  stepsList.innerHTML = "";
  recipe.steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    stepsList.appendChild(li);
  });

  // Show recipe view, hide form
  noRecipeMessage.classList.add("hidden");
  recipeView.classList.remove("hidden");
  recipeForm.classList.add("hidden");
}

// Handle search
async function handleSearch() {
  const query = searchInput.value.trim();
  const category = categoryFilter.value;

  try {
    let results;

    if (query === "" && category === "") {
      // If no search criteria, get all recipes
      results = await window.pywebview.api.get_recipes();
    } else {
      // Search with criteria
      results = await window.pywebview.api.search_recipes(
        query,
        category || null
      );
    }

    console.log("Search results:", results);

    if (results.error) {
      console.error("Search error:", results.error);
      return;
    }

    currentRecipes = results;
    renderRecipeList();

    // Select first result if available
    if (currentRecipes.length > 0) {
      selectRecipe(currentRecipes[0].id);
    } else {
      // Hide recipe view if no results
      noRecipeMessage.classList.remove("hidden");
      recipeView.classList.add("hidden");
      recipeForm.classList.add("hidden");
    }
  } catch (error) {
    console.error("Error during search:", error);
  }
}

// Show the add recipe form
function showAddRecipeForm() {
  // Reset form
  recipeEditForm.reset();
  recipeIdInput.value = "";
  formTitle.textContent = "新規レシピ";

  // Clear ingredients and steps
  ingredientsContainer.innerHTML = "";
  stepsContainer.innerHTML = "";

  // Add initial rows
  addIngredientRow();
  addStepRow();

  // Show form, hide other views
  noRecipeMessage.classList.add("hidden");
  recipeView.classList.add("hidden");
  recipeForm.classList.remove("hidden");
}

// Handle edit recipe
function handleEditRecipe() {
  if (!selectedRecipeId) return;

  const recipe = currentRecipes.find((r) => r.id === selectedRecipeId);
  if (!recipe) return;

  // Set form title
  formTitle.textContent = "レシピを編集";

  // Populate form fields
  recipeIdInput.value = recipe.id;
  formName.value = recipe.name;
  formDescription.value = recipe.description;
  formCategory.value = recipe.category;
  formServings.value = recipe.servings;
  formPrepTime.value = recipe.prepTime;
  formCookTime.value = recipe.cookTime;

  // Clear and populate ingredients
  ingredientsContainer.innerHTML = "";
  recipe.ingredients.forEach((ingredient) => {
    addIngredientRow(ingredient.name, ingredient.amount, ingredient.unit);
  });

  // Clear and populate steps
  stepsContainer.innerHTML = "";
  recipe.steps.forEach((step) => {
    addStepRow(step);
  });

  // Show form, hide other views
  noRecipeMessage.classList.add("hidden");
  recipeView.classList.add("hidden");
  recipeForm.classList.remove("hidden");
}

// Add an ingredient row to the form
function addIngredientRow(name = "", amount = "", unit = "") {
  const row = document.createElement("div");
  row.className = "ingredient-row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "材料名";
  nameInput.value = name;
  nameInput.required = true;

  const amountInput = document.createElement("input");
  amountInput.type = "text";
  amountInput.placeholder = "量";
  amountInput.value = amount;

  const unitInput = document.createElement("input");
  unitInput.type = "text";
  unitInput.placeholder = "単位";
  unitInput.value = unit;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-btn";
  removeBtn.innerHTML = "×";
  removeBtn.addEventListener("click", () => {
    row.remove();
  });

  row.appendChild(nameInput);
  row.appendChild(amountInput);
  row.appendChild(unitInput);
  row.appendChild(removeBtn);

  ingredientsContainer.appendChild(row);
}

// Add a step row to the form
function addStepRow(step = "") {
  const row = document.createElement("div");
  row.className = "step-row";

  const stepInput = document.createElement("textarea");
  stepInput.placeholder = "調理手順";
  stepInput.value = step;
  stepInput.rows = 2;
  stepInput.required = true;

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-btn";
  removeBtn.innerHTML = "×";
  removeBtn.addEventListener("click", () => {
    row.remove();
  });

  row.appendChild(stepInput);
  row.appendChild(removeBtn);

  stepsContainer.appendChild(row);
}

// Hide the recipe form
function hideRecipeForm() {
  if (selectedRecipeId) {
    // If a recipe was selected, go back to viewing it
    noRecipeMessage.classList.add("hidden");
    recipeView.classList.remove("hidden");
    recipeForm.classList.add("hidden");
  } else {
    // Otherwise show the no recipe message
    noRecipeMessage.classList.remove("hidden");
    recipeView.classList.add("hidden");
    recipeForm.classList.add("hidden");
  }
}

// Handle save recipe
async function handleSaveRecipe(event) {
  event.preventDefault();

  // Collect ingredients
  const ingredients = [];
  const ingredientRows =
    ingredientsContainer.querySelectorAll(".ingredient-row");
  ingredientRows.forEach((row) => {
    const inputs = row.querySelectorAll("input");
    ingredients.push({
      name: inputs[0].value,
      amount: inputs[1].value,
      unit: inputs[2].value,
    });
  });

  // Collect steps
  const steps = [];
  const stepRows = stepsContainer.querySelectorAll(".step-row");
  stepRows.forEach((row) => {
    const textarea = row.querySelector("textarea");
    steps.push(textarea.value);
  });

  // Create recipe data object
  const recipeData = {
    name: formName.value,
    description: formDescription.value,
    category: formCategory.value,
    ingredients: ingredients,
    steps: steps,
    prepTime: parseInt(formPrepTime.value) || 0,
    cookTime: parseInt(formCookTime.value) || 0,
    servings: parseInt(formServings.value) || 1,
  };

  try {
    let result;

    if (recipeIdInput.value) {
      // Update existing recipe
      const recipeId = parseInt(recipeIdInput.value);
      result = await window.pywebview.api.update_recipe(recipeId, recipeData);
      console.log("Updated recipe:", result);
    } else {
      // Add new recipe
      result = await window.pywebview.api.add_recipe(recipeData);
      console.log("Added recipe:", result);
    }

    if (result.error) {
      console.error("Error saving recipe:", result.error);
      alert("レシピの保存中にエラーが発生しました: " + result.error);
      return;
    }

    // Reload recipes and select the saved one
    await loadRecipes();
    selectRecipe(result.recipe.id);

    // Hide form
    hideRecipeForm();
  } catch (error) {
    console.error("Error saving recipe:", error);
    alert("レシピの保存中にエラーが発生しました");
  }
}

// Handle delete recipe
async function handleDeleteRecipe() {
  if (!selectedRecipeId) return;

  if (!confirm("このレシピを削除してもよろしいですか？")) {
    return;
  }

  try {
    const result = await window.pywebview.api.delete_recipe(selectedRecipeId);
    console.log("Delete result:", result);

    if (result.error) {
      console.error("Error deleting recipe:", result.error);
      alert("レシピの削除中にエラーが発生しました: " + result.error);
      return;
    }

    // Reload recipes
    await loadRecipes();

    // Select first recipe or show no recipe message
    if (currentRecipes.length > 0) {
      selectRecipe(currentRecipes[0].id);
    } else {
      selectedRecipeId = null;
      noRecipeMessage.classList.remove("hidden");
      recipeView.classList.add("hidden");
      recipeForm.classList.add("hidden");
    }
  } catch (error) {
    console.error("Error deleting recipe:", error);
    alert("レシピの削除中にエラーが発生しました");
  }
}

// Handle add category
async function handleAddCategory() {
  const categoryName = newCategoryInput.value.trim();
  if (!categoryName) return;

  try {
    const result = await window.pywebview.api.add_category(categoryName);
    console.log("Add category result:", result);

    if (result.error) {
      console.error("Error adding category:", result.error);
      alert("カテゴリの追加中にエラーが発生しました: " + result.error);
      return;
    }

    // Clear input
    newCategoryInput.value = "";

    // Reload categories
    await loadCategories();
  } catch (error) {
    console.error("Error adding category:", error);
    alert("カテゴリの追加中にエラーが発生しました");
  }
}

// Handle delete category
async function handleDeleteCategory(categoryId) {
  if (!confirm("このカテゴリを削除してもよろしいですか？")) {
    return;
  }

  try {
    const result = await window.pywebview.api.delete_category(categoryId);
    console.log("Delete category result:", result);

    if (result.error) {
      console.error("Error deleting category:", result.error);
      alert("カテゴリの削除中にエラーが発生しました: " + result.error);
      return;
    }

    // Reload categories
    await loadCategories();

    // Reload recipes to update UI
    await loadRecipes();
  } catch (error) {
    console.error("Error deleting category:", error);
    alert("カテゴリの削除中にエラーが発生しました");
  }
}
