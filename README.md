# 🐾 Multi-Class Animal Image Classification

## 📌 Project Overview

The **Multi-Class Animal Image Classification** project is a Deep Learning-based application that identifies and classifies animal images into 10 different categories using Artificial Intelligence (AI), Machine Learning (ML), and Computer Vision.

The system uses the **Animals-10 dataset from Kaggle** to train an image classification model. Users can upload an animal image through a simple web interface, and the trained model predicts the most likely animal categories.

The application displays the **Top 3 predictions** to help users understand the classification results.

## 🎯 Project Objectives

- Develop an automated animal image classification system.
- Classify images into 10 predefined animal categories.
- Prepare and preprocess image data for model training.
- Train and evaluate a deep learning model.
- Provide an easy-to-use image upload interface.
- Display the top three prediction results.

## 🐶 Animal Categories

The project uses the following 10 categories from the Animals-10 dataset:

| No. | Animal Category |
|---|---|
| 1 | Dog |
| 2 | Horse |
| 3 | Elephant |
| 4 | Butterfly |
| 5 | Chicken |
| 6 | Cat |
| 7 | Cow |
| 8 | Sheep |
| 9 | Spider |
| 10 | Squirrel |

## 🛠️ Technologies Used

- **Python** – Main programming language
- **Google Colab** – Development and training environment
- **TensorFlow / Keras** – Deep learning and model training
- **KaggleHub** – Dataset downloading
- **NumPy** – Numerical operations
- **Matplotlib** – Data visualization
- **Pillow (PIL)** – Image processing
- **Gradio** – Interactive web interface

## 📂 Dataset

**Dataset Name:** Animals-10

**Source:** [Animals-10 Dataset on Kaggle](https://www.kaggle.com/datasets/alessiocorrado99/animals10)

The dataset contains images belonging to 10 animal categories. The images are loaded from their respective class folders and resized to **180 × 180 pixels** before being used by the model.

## ⚙️ Project Workflow

1. **Dataset Collection:** Download the Animals-10 dataset from Kaggle.
2. **Data Preprocessing:** Load and resize images to 180 × 180 pixels.
3. **Dataset Splitting:** Divide the dataset into 80% training and 20% validation data.
4. **Model Training:** Train the classification model using TensorFlow/Keras.
5. **Model Evaluation:** Monitor training and validation accuracy and loss.
6. **Model Saving:** Save the trained model and class labels.
7. **Image Upload:** Allow users to upload an animal image through Gradio.
8. **Prediction:** Generate classification scores and display the top three predictions.

## 📊 Model Configuration

| Parameter | Value |
|---|---|
| Dataset | Animals-10 |
| Number of Classes | 10 |
| Image Size | 180 × 180 |
| Batch Size | 32 |
| Training Epochs | 5 |
| Training Data | 80% |
| Validation Data | 20% |
| Prediction Output | Top 3 Classes |

*Note: The model architecture and final accuracy should be added according to the actual implementation and training results.*

## 🖥️ Application Features

- Upload animal images.
- Automatically preprocess uploaded images.
- Predict the animal category.
- Display the top three prediction results.
- Show animal category names in English.
- Simple and interactive Gradio interface.

## 🚀 Installation and Execution

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
```

### 2. Open the Project

Navigate to the downloaded project folder:

```bash
cd YOUR-REPOSITORY
```

### 3. Install Required Libraries

```bash
pip install tensorflow numpy matplotlib pillow gradio kagglehub
```

### 4. Open Google Colab

Upload or open the project notebook (`.ipynb`) in Google Colab.

### 5. Configure Kaggle API

Add your Kaggle API token to Google Colab Secrets using the name:

```text
KAGGLE_API_TOKEN
```

Enable notebook access to the secret.

### 6. Run the Notebook

Execute the notebook cells in sequence to:

- Download the dataset.
- Prepare the images.
- Train the model.
- Evaluate model performance.
- Save the trained model.
- Launch the Gradio interface.

## 📈 Results

The trained model generates predictions for uploaded animal images and displays up to three likely animal categories.

Training and validation accuracy and loss are monitored to understand the model's learning performance.

**Note:** Add your actual validation accuracy and training graphs here after completing the final model evaluation.

## 🔮 Future Scope

- Increase the number of animal categories.
- Improve classification accuracy using advanced architectures.
- Implement real-time animal recognition using a camera.
- Develop an Android or mobile application.
- Deploy the model on a cloud platform.
- Add animal information such as habitat and characteristics.
- Optimize the model for faster predictions.

## 🎓 Applications

- Wildlife monitoring
- Animal identification
- Educational applications
- Biodiversity research
- Computer vision projects
- Automated image recognition

## ⚠️ Limitations

- The current system supports only 10 animal categories.
- Prediction quality may depend on image clarity and lighting.
- Similar-looking animals may sometimes be misclassified.
- Predictions are not guaranteed to be correct.
- The reported validation performance is not a substitute for evaluation on an independent test dataset.

## 👨‍💻 Project Team

**Department:** Computer Science Engineering  
**Course:** B.Tech (CSE)  
**University:** Invertis University  
**Program:** Deep Learning  
**Project Mentor:** Mr. Raushan Raj

**Team Members:**
- Arpit Diwakar (Team Leader)
- Hirdesh
- Devesh Kumar
- Kartik Singh
- Awwaleen Ali
- Simon Massey Bhaskar Gole
- Bharat Bhusan
- Aryan Gangwar

## 📜 License

This project is developed for academic and educational purposes. Check the dataset's license and terms before redistributing the dataset or its images.

## ⭐ Acknowledgement

We would like to thank our mentor, faculty members, and Invertis University for their guidance and support throughout the development of this project.

---

**If you find this project useful, consider giving the repository a ⭐ on GitHub!**
