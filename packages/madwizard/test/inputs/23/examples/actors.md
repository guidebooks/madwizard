# Ray Core: Parallelizing Classes with Ray Actors

Ray provides actors to allow you to parallelize an instance of a class in Python or Java. When you instantiate a class that is a Ray actor, Ray will start a remote instance of that class in the cluster. This actor can then execute remote method calls and maintain its own internal state.

```python
import ray
ray.init() # Only call this once.

@ray.remote
class Counter(object):
    def __init__(self):
        self.n = 0

    def increment(self):
        self.n += 1

    def read(self):
        return self.n

counters = [Counter.remote() for i in range(4)]
[c.increment.remote() for c in counters]
futures = [c.read.remote() for c in counters]
print(ray.get(futures)) # [1, 1, 1, 1]
```
