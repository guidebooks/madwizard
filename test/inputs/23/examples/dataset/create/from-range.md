Get started by creating Datasets from synthetic data using
`ray.data.range()` and `ray.data.from_items()`. Datasets can hold
either plain Python objects (schema is a Python type), or
[Arrow](https://arrow.apache.org/docs/index.html) records ([schema is
Arrow](https://arrow.apache.org/docs/python/api/datatypes.html)).

```python
import ray

# Create a Dataset of Python objects.
ds = ray.data.range(10000)
# -> Dataset(num_blocks=200, num_rows=10000, schema=<class 'int'>)

ds.take(5)
# -> [0, 1, 2, 3, 4]

ds.count()
# -> 10000

# Create a Dataset of Arrow records.
ds = ray.data.from_items([{"col1": i, "col2": str(i)} for i in range(10000)])
# -> Dataset(num_blocks=200, num_rows=10000, schema={col1: int64, col2: string})

ds.show(5)
# -> {'col1': 0, 'col2': '0'}
# -> {'col1': 1, 'col2': '1'}
# -> {'col1': 2, 'col2': '2'}
# -> {'col1': 3, 'col2': '3'}
# -> {'col1': 4, 'col2': '4'}

ds.schema()
# -> col1: int64
# -> col2: string
```
