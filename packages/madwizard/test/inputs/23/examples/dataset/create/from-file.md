Datasets can be created from files on local disk or remote datasources
such as S3. Any filesystem [supported by
pyarrow](http://arrow.apache.org/docs/python/generated/pyarrow.fs.FileSystem.html)
can be used to specify file locations. You can also create a Dataset
from existing data in the Ray [object
store](https://docs.ray.io/en/latest/ray-core/objects.html#objects-in-ray)
or Ray-compatible distributed
[DataFrames](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.html).

Datasets can be transformed in parallel using
`.map()`. Transformations are executed eagerly and block until the
operation is finished. Datasets also supports `.filter()` and
`.flat_map()`.

```python
import ray
import pandas as pd
import dask.dataframe as dd

# Create a Dataset from a list of Pandas DataFrame objects.
pdf = pd.DataFrame({"one": [1, 2, 3], "two": ["a", "b", "c"]})
ds = ray.data.from_pandas([pdf])

# Create a Dataset from a Dask-on-Ray DataFrame.
dask_df = dd.from_pandas(pdf, npartitions=10)
ds = ray.data.from_dask(dask_df)

# Transform the dataset using .map()
ds = ray.data.range(10000)
ds = ds.map(lambda x: x * 2)
# -> Map Progress: 100%|████████████████████| 200/200 [00:00<00:00, 1123.54it/s]
# -> Dataset(num_blocks=200, num_rows=10000, schema=<class 'int'>)
ds.take(5)
# -> [0, 2, 4, 6, 8]

# Transform the dataset using .filter()
ds.filter(lambda x: x > 5).take(5)
# -> Map Progress: 100%|████████████████████| 200/200 [00:00<00:00, 1859.63it/s]
# -> [6, 8, 10, 12, 14]

# Transform the dataset using .flat_map()
ds.flat_map(lambda x: [x, -x]).take(5)
# -> Map Progress: 100%|████████████████████| 200/200 [00:00<00:00, 1568.10it/s]
# -> [0, 0, 2, -2, 4]
```
