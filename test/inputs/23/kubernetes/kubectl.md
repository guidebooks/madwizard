# Install [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl){target=_blank}

Runs commands against Kubernetes clusters. You can use `kubectl` to deploy applications, inspect and manage cluster resources, and view logs.

!!! warning "Version Compatibility"
    You must use a kubectl version that is within one minor version difference of your cluster. For example, a v1.23 client can communicate with v1.22, v1.23, and v1.24 control planes. Using the latest compatible version of kubectl helps avoid unforeseen issues.

=== "Linux"

    Download the latest release with the command:

    ```bash
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    ```

=== "Windows"

    Download the latest release:

    ```bash
    curl -LO "https://dl.k8s.io/release/v1.23.0/bin/windows/amd64/kubectl.exe"
    ```

    ??? note
        To find out the latest stable version (for example, for scripting), take a look at https://dl.k8s.io/release/stable.txt.


=== "MacOS"

    The following methods exist for installing kubectl on macOS:

    === "Homebrew"
        If you are on macOS and using Homebrew package manager, you can install kubectl with Homebrew.
        
        ```bash
        brew install kubectl 
        ```
    
    === "curl"
        
        To download the latest release:

        === "Intel"
            ```bash
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl.sha256"
            ```
            
        === "Apple Silicon"
            ```bash
            curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/arm64/kubectl.sha256"
            ```

        !!! note
            To download a specific version, replace the $(curl -L -s https://dl.k8s.io/release/stable.txt) portion of the command with the specific version.

            For example, to download version v1.23.0 on Intel macOS, type:

            ```bash
            curl -LO "https://dl.k8s.io/release/v1.23.0/bin/darwin/amd64/kubectl"
            And for macOS on Apple Silicon, type:

            curl -LO "https://dl.k8s.io/release/v1.23.0/bin/darwin/arm64/kubectl"
            ```
    
