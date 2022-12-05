# Ray Core: Parallelizing Functions with Ray Tasks

First, you import Ray and and initialize it with `ray.init()`. Then
you decorate your function with `@ray.remote` to declare that you want
to run this function remotely. Lastly, you call that function with
`.remote()` instead of calling it normally. This remote call yields a
future, a so-called Ray object reference, that you can then fetch with
`ray.get`.

```python
import ray
ray.init()

@ray.remote
def f(x):
    return x * x

futures = [f.remote(i) for i in range(4)]
print(ray.get(futures)) # [0, 1, 4, 9]
```

In the above code block we defined some Ray Tasks. While these are
great for stateless operations, sometimes you must maintain the state
of your application. You can do that with Ray Actors.
