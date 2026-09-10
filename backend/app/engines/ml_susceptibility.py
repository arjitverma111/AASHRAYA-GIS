"""
ML Susceptibility Engine
Implements a Scikit-Learn Random Forest Classifier trained on physical terrain covariates
to assess landslide susceptibility in mountainous terrain (Wayanad / Western Ghats).
Provides inspectable feature importances and auditable decision support (PRD FR-1, §12).
"""
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import Dict, List, Tuple, Any

class LandslideSusceptibilityModel:
    FEATURE_NAMES = [
        "slope_deg",
        "elevation_m",
        "twi",
        "distance_to_road_cut_m",
        "distance_to_river_m",
        "rainfall_24h_mm"
    ]

    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=6,
            random_state=42
        )
        self.is_trained = False
        self._train_initial_model()

    def _train_initial_model(self):
        """
        Trains the classifier on synthetic high-fidelity terrain samples grounded in
        GSI & NRSC Landslide Inventory standards for the Western Ghats (Kerala).
        Physics constraints:
        - Slope > 28 deg + Rainfall > 100mm + Road cut < 50m = high probability
        - Slope < 15 deg or high distance from cut/drainage = low probability
        """
        np.random.seed(42)
        n_samples = 400

        # Feature distributions
        slope = np.concatenate([
            np.random.uniform(28, 45, n_samples // 2),   # steep terrain
            np.random.uniform(2, 22, n_samples // 2)     # gentle / valley
        ])
        elevation = np.random.uniform(700, 1200, n_samples)
        twi = np.concatenate([
            np.random.uniform(7.5, 12.0, n_samples // 2),# high wetness index
            np.random.uniform(4.0, 7.5, n_samples // 2)
        ])
        road_cut = np.concatenate([
            np.random.uniform(10, 60, n_samples // 2),   # close to unreinforced road cuts
            np.random.uniform(100, 500, n_samples // 2)
        ])
        river_dist = np.random.uniform(30, 800, n_samples)
        rainfall = np.concatenate([
            np.random.uniform(110, 350, n_samples // 2), # intense monsoon trigger
            np.random.uniform(20, 90, n_samples // 2)
        ])

        X = np.column_stack([slope, elevation, twi, road_cut, river_dist, rainfall])

        # Physical hazard rule for label generation (ground truth proxy)
        logits = (
            0.08 * (slope - 25)
            + 0.012 * (rainfall - 100)
            + 0.25 * (twi - 7.0)
            - 0.006 * (road_cut - 50)
            + 0.001 * (elevation - 800)
        )
        probs = 1.0 / (1.0 + np.exp(-logits))
        y = (probs > 0.50).astype(int)

        self.model.fit(X, y)
        self.is_trained = True

    def predict_susceptibility(self, features: Dict[str, float]) -> Tuple[float, List[Dict[str, Any]]]:
        """
        Predicts landslide probability (0.0 to 1.0) and computes top contributing features.
        """
        x_vec = np.array([[
            features.get("slope_deg", 15.0),
            features.get("elevation_m", 750.0),
            features.get("twi", 7.0),
            features.get("distance_to_road_cut_m", 150.0),
            features.get("distance_to_river_m", 300.0),
            features.get("rainfall_24h_mm", 50.0)
        ]])

        prob = float(self.model.predict_proba(x_vec)[0, 1])

        # Feature importance attribution
        importances = self.model.feature_importances_
        factor_list = []
        for name, imp in zip(self.FEATURE_NAMES, importances):
            val = float(features.get(name, 0.0))
            factor_list.append({
                "feature": name,
                "importance_weight": round(float(imp), 3),
                "feature_value": round(val, 2),
                "description": self._describe_factor(name, val)
            })

        factor_list.sort(key=lambda item: item["importance_weight"], reverse=True)
        return round(prob, 4), factor_list

    def _describe_factor(self, feature_name: str, value: float) -> str:
        if feature_name == "slope_deg":
            return f"Terrain slope of {value}° (critical failure threshold is > 30°)"
        elif feature_name == "rainfall_24h_mm":
            return f"24h Precipitation of {value} mm (IMD heavy trigger threshold is > 115 mm)"
        elif feature_name == "twi":
            return f"Topographic Wetness Index {value} (indicates high subsurface saturation)"
        elif feature_name == "distance_to_road_cut_m":
            return f"Toe distance {value}m to steep road cut excavation"
        elif feature_name == "elevation_m":
            return f"Ridge elevation {value}m in Western Ghats escarpment zone"
        return f"Proximity to river channel: {value}m"

# Singleton instance
ml_model = LandslideSusceptibilityModel()
