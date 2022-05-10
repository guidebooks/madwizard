# Install Ray

=== "Local Install"
    This will install Ray on your laptop.

    === "Linux"
        ```shell
        pip install -U ray
        ```

    === "Windows"
        ```shell
        pip install -U ray
        ```

    === "MacOS"
        === "Intel"
            If you are running on x86/Intel hardware.

            ```shell
            pip install -U ray
            ```

        === "Apple Silicon"
            If you are running on Apple Silicon/ARM hardware.
        
            :import{conda.md}

        
            ```shell
            conda activate
            pip uninstall grpcio
            conda install grpcio
            pip install ray
            ```
        
=== "Kubernetes Install"
    --8<-- "kubernetes.md"
