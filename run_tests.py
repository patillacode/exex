#!/usr/bin/env python
"""
Test Runner for Expresión Exprés

This script runs all tests for the Expresión Exprés application,
with proper path setup and coverage reporting.
"""

import unittest
import os
import sys
import coverage

def run_tests():
    """Run all tests in the tests directory."""
    
    # Start code coverage
    cov = coverage.Coverage(
        source=['app'],
        omit=[
            '*/venv/*',
            '*/tests/*',
            '*/migrations/*'
        ]
    )
    cov.start()

    # Import all tests from tests directory
    tests_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'tests'))
    sys.path.insert(0, tests_dir)
    
    # Discover and run tests
    loader = unittest.TestLoader()
    suite = loader.discover(tests_dir)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Stop and report coverage
    cov.stop()
    cov.report()
    
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    sys.exit(run_tests())