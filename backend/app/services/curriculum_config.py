# app/services/curriculum_config.py

# Global Assessment Rules (Applies to all subtopic assessments)
ASSESSMENT_CONFIG = {
    "question_count": 5,
    "marks_per_question": 10,
    "total_marks": 50,
    "passing_marks": 40,  # 80% pass threshold
}

# Subtopic Curriculum Configuration (48 Subtopics)
CURRICULUM_CONFIG = {
    "beginner": {
        "arithmetic": {
            "subtopics": {
                "addition_subtraction": {
                    "name": "Addition & Subtraction",
                    "concepts": ["basic addition", "basic subtraction", "borrowing & carrying"]
                },
                "multiplication_division": {
                    "name": "Multiplication & Division",
                    "concepts": ["single-digit multiplication", "basic division", "equal sharing"]
                }
            }
        },
        "fractions": {
            "subtopics": {
                "understanding_fractions": {
                    "name": "Understanding Fractions",
                    "concepts": ["numerator and denominator", "visual representation", "proper fractions"]
                },
                "comparing_fractions": {
                    "name": "Comparing Fractions",
                    "concepts": ["compare simple fractions", "identify greater fraction", "identify smaller fraction", "use > < ="]
                }
            }
        },
        "decimals": {
            "subtopics": {
                "place_value_reading": {
                    "name": "Place Value & Reading Decimals",
                    "concepts": ["tenths and hundredths", "reading decimals", "decimal places"]
                },
                "comparing_ordering_decimals": {
                    "name": "Comparing & Ordering Decimals",
                    "concepts": ["ordering decimals", "greater than less than", "equal decimals"]
                }
            }
        },
        "linear_equations": {
            "subtopics": {
                "variables_expressions": {
                    "name": "Variables & Expressions",
                    "concepts": ["identifying variables", "simple algebraic terms"]
                },
                "one_step_equations": {
                    "name": "One-Step Equations",
                    "concepts": ["solving for x with addition", "solving for x with multiplication"]
                }
            }
        },
        "quadratics": {
            "subtopics": {
                "understanding_quadratic_expressions": {
                    "name": "Understanding Quadratic Expressions",
                    "concepts": ["degree of 2", "identifying squared terms"]
                },
                "basic_quadratic_patterns": {
                    "name": "Basic Quadratic Patterns",
                    "concepts": ["x^2 patterns", "simple evaluation"]
                }
            }
        },
        "word_problems": {
            "subtopics": {
                "identifying_given_info": {
                    "name": "Identifying Given Information",
                    "concepts": ["extracting numbers from text", "key word identification"]
                },
                "identifying_what_to_find": {
                    "name": "Identifying What to Find",
                    "concepts": ["identifying question goals", "setting up relations"]
                }
            }
        }
    },
    "developing": {
        "arithmetic": {
            "subtopics": {
                "integers": {
                    "name": "Integers",
                    "concepts": ["positive and negative numbers", "number lines"]
                },
                "percentages": {
                    "name": "Percentages",
                    "concepts": ["calculating percent", "converting percent to fraction"]
                },
                "ratios_proportions": {
                    "name": "Ratios & Proportions",
                    "concepts": ["ratio simplification", "equivalent ratios"]
                }
            }
        },
        "fractions": {
            "subtopics": {
                "adding_subtracting_fractions": {
                    "name": "Adding & Subtracting Fractions",
                    "concepts": ["common denominators", "LCM"]
                },
                "multiplying_dividing_fractions": {
                    "name": "Multiplying & Dividing Fractions",
                    "concepts": ["multiplying fractions", "dividing fractions", "using reciprocals"]
                },
                "mixed_numbers": {
                    "name": "Mixed Numbers",
                    "concepts": ["improper fractions", "mixed number operations"]
                }
            }
        },
        "decimals": {
            "subtopics": {
                "multiplying_decimals": {
                    "name": "Multiplying Decimals",
                    "concepts": ["decimal placement in products"]
                },
                "dividing_decimals": {
                    "name": "Dividing Decimals",
                    "concepts": ["long division with decimals"]
                },
                "decimal_fraction_conversion": {
                    "name": "Decimal & Fraction Conversion",
                    "concepts": ["converting tenths/hundredths to fractions"]
                }
            }
        },
        "linear_equations": {
            "subtopics": {
                "two_step_equations": {
                    "name": "Two-Step Equations",
                    "concepts": ["isolation of variables in 2 steps"]
                },
                "multi_step_equations": {
                    "name": "Multi-Step Equations",
                    "concepts": ["combining like terms"]
                },
                "variables_on_both_sides": {
                    "name": "Variables on Both Sides",
                    "concepts": ["balancing equation sides"]
                }
            }
        },
        "quadratics": {
            "subtopics": {
                "factoring_quadratics": {
                    "name": "Factoring Quadratics",
                    "concepts": ["finding factors of c that add to b"]
                },
                "quadratic_formula": {
                    "name": "Quadratic Formula",
                    "concepts": ["applying quadratic formula"]
                },
                "completing_the_square": {
                    "name": "Completing the Square",
                    "concepts": ["perfect square trinomials"]
                }
            }
        },
        "word_problems": {
            "subtopics": {
                "multi_step_problems": {
                    "name": "Multi-Step Problems",
                    "concepts": ["sequential problem solving"]
                },
                "percentage_ratio_problems": {
                    "name": "Percentage & Ratio Problems",
                    "concepts": ["real world discounts and proportions"]
                },
                "linear_equation_problems": {
                    "name": "Linear Equation Problems",
                    "concepts": ["word-to-equation modeling"]
                }
            }
        }
    },
    "proficiency": {
        "arithmetic": {
            "subtopics": {
                "complex_numerical_expressions": {
                    "name": "Complex Numerical Expressions",
                    "concepts": ["nested parentheses", "order of operations"]
                },
                "percentage_applications": {
                    "name": "Percentage Applications",
                    "concepts": ["compound interest", "growth rates"]
                },
                "multi_step_numerical_problems": {
                    "name": "Multi-Step Numerical Problems",
                    "concepts": ["chained calculations"]
                }
            }
        },
        "fractions": {
            "subtopics": {
                "complex_fractions": {
                    "name": "Complex Fractions",
                    "concepts": ["fractions within fractions"]
                },
                "fractional_expressions": {
                    "name": "Fractional Expressions",
                    "concepts": ["algebraic denominators"]
                },
                "advanced_fraction_applications": {
                    "name": "Advanced Fraction Applications",
                    "concepts": ["mixture and rate fraction problems"]
                }
            }
        },
        "decimals": {
            "subtopics": {
                "recurring_decimals": {
                    "name": "Recurring Decimals",
                    "concepts": ["converting repeating decimals to fractions"]
                },
                "complex_decimal_operations": {
                    "name": "Complex Decimal Operations",
                    "concepts": ["high-precision operations"]
                },
                "advanced_decimal_applications": {
                    "name": "Advanced Decimal Applications",
                    "concepts": ["financial decimal modeling"]
                }
            }
        },
        "linear_equations": {
            "subtopics": {
                "complex_multi_step_equations": {
                    "name": "Complex Multi-Step Equations",
                    "concepts": ["fractional coefficients"]
                },
                "literal_equations": {
                    "name": "Literal Equations",
                    "concepts": ["solving for one variable in terms of others"]
                },
                "absolute_value_equations": {
                    "name": "Absolute Value Equations",
                    "concepts": ["dual case solving"]
                }
            }
        },
        "quadratics": {
            "subtopics": {
                "discriminant": {
                    "name": "Discriminant",
                    "concepts": ["b^2 - 4ac", "nature of roots"]
                },
                "vertex_axis_of_symmetry": {
                    "name": "Vertex & Axis of Symmetry",
                    "concepts": ["-b/2a", "finding max/min points"]
                },
                "quadratic_applications": {
                    "name": "Quadratic Applications",
                    "concepts": ["projectile motion word problems"]
                }
            }
        },
        "word_problems": {
            "subtopics": {
                "rate_time_distance": {
                    "name": "Rate, Time & Distance",
                    "concepts": ["d = r*t modeling"]
                },
                "work_mixture_problems": {
                    "name": "Work & Mixture Problems",
                    "concepts": ["combined work rates", "solution mixtures"]
                },
                "complex_real_world_modeling": {
                    "name": "Complex Real-World Modeling",
                    "concepts": ["multi-variable word problems"]
                }
            }
        }
    }
}

LEVEL_ORDER = ["beginner", "developing", "proficiency"]
SKILL_ORDER = [
    "arithmetic",
    "fractions",
    "decimals",
    "linear_equations",
    "quadratics",
    "word_problems",
]
SKILL_LABELS = {
    "arithmetic": "Arithmetic",
    "fractions": "Fractions",
    "decimals": "Decimals",
    "linear_equations": "Linear Equations",
    "quadratics": "Quadratics",
    "word_problems": "Word Problems",
}
LEVEL_LABELS = {
    "beginner": "Beginner",
    "developing": "Proficiency",
    "proficiency": "Advanced",
}
SUBTOPIC_COUNTS = {
    "beginner": 2,
    "developing": 3,
    "proficiency": 3,
}
NEXT_LEVEL_MAP = {
    "beginner": "developing",
    "developing": "proficiency",
    "proficiency": None,
}


def get_subtopic_entry(level: str, skill: str, subtopic: str) -> dict:
    return (
        CURRICULUM_CONFIG.get(level, {})
        .get(skill, {})
        .get("subtopics", {})
        .get(subtopic, {})
    )


def list_subtopic_ids(level: str, skill: str) -> list[str]:
    return list(
        CURRICULUM_CONFIG.get(level, {}).get(skill, {}).get("subtopics", {}).keys()
    )