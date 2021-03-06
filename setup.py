from setuptools import setup, find_packages

setup(
    name='bikepark',
    include_package_data=True,
    packages=find_packages(exclude=['ez_setup']),
    install_requires=[
        "bottle",
        "requests",
        "pymongo",
        "flup",
        "unidecode",
    ],
    entry_points="""
    [console_scripts]
    bikepark = bikepark:main
    bikepark-export = bikepark.mongo2csv:main
    """)
