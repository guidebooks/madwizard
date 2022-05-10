---
imports:
    - kubectl.md
    - helm3.md
---

# Install Ray on a Kubernetes Cluster

This will install Ray on a Kubernetes context of your choosing.

```shell
helm -n ray install example-cluster --create-namespace https://github.com/ray-project/ray/tree/master/deploy/charts/ray/
kubectl wait --for=condition=available --all rayclusters
```
